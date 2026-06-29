from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models, os, requests, json, re

router = APIRouter()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

SYSTEM_PROMPT = """You are the Learnly AI Tutor — a warm, patient, encouraging teaching assistant inside an online learning app.

Rules:
- Explain concepts in the simplest possible way, using everyday analogies and short examples.
- Break big topics into small steps.
- After explaining, briefly check understanding by asking a short follow-up question or offering to go deeper or give an example.
- Keep answers concise (use bullet points or short paragraphs, avoid huge walls of text).
- Be genuinely encouraging — students may feel stuck or anxious, so be kind and motivating.
- If asked something unrelated to learning, gently redirect back to studies.
- Never just give a flat answer — always sound like a real tutor having a conversation."""

class ChatIn(BaseModel):
    message: str

class QuizIn(BaseModel):
    topic: str
    num_questions: Optional[int] = 5
    difficulty: Optional[str] = "medium"

def call_gemini(contents):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="AI tutor is not configured yet. Add GEMINI_API_KEY on the server.")
    try:
        resp = requests.post(GEMINI_URL, json={"contents": contents}, timeout=30)
        data = resp.json()
        if resp.status_code != 200:
            msg = data.get("error", {}).get("message", "AI request failed")
            raise HTTPException(status_code=500, detail=msg)
        candidates = data.get("candidates", [])
        if not candidates:
            raise HTTPException(status_code=500, detail="AI did not return a response")
        parts = candidates[0]["content"]["parts"]
        return "".join(p.get("text", "") for p in parts)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=500, detail="Could not reach AI service")

@router.post("/chat")
def chat(data: ChatIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_msg = models.AITutorMessage(user_id=user.id, role="user", content=data.message)
    db.add(user_msg)
    db.commit()

    history = db.query(models.AITutorMessage).filter(
        models.AITutorMessage.user_id == user.id
    ).order_by(models.AITutorMessage.created_at.desc()).limit(12).all()
    history.reverse()

    contents = [
        {"role": "user", "parts": [{"text": SYSTEM_PROMPT}]},
        {"role": "model", "parts": [{"text": "Got it! I'm ready to help students learn step by step. 😊"}]}
    ]
    for h in history:
        role = "user" if h.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": h.content}]})

    reply = call_gemini(contents)

    ai_msg = models.AITutorMessage(user_id=user.id, role="assistant", content=reply)
    db.add(ai_msg)
    db.commit()

    return {"reply": reply}

@router.get("/messages")
def get_messages(db: Session = Depends(get_db), user=Depends(get_current_user)):
    msgs = db.query(models.AITutorMessage).filter(
        models.AITutorMessage.user_id == user.id
    ).order_by(models.AITutorMessage.created_at.asc()).limit(100).all()
    return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in msgs]

@router.delete("/messages")
def clear_messages(db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.query(models.AITutorMessage).filter(models.AITutorMessage.user_id == user.id).delete()
    db.commit()
    return {"message": "Chat history cleared"}

@router.post("/quiz")
def generate_quiz(data: QuizIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    prompt = f"""Create a {data.num_questions}-question multiple choice practice quiz about "{data.topic}" at {data.difficulty} difficulty for a student.
Return ONLY valid JSON, no markdown formatting, no extra text, in exactly this structure:
{{
  "topic": "{data.topic}",
  "questions": [
    {{"question": "...", "option_a": "...", "option_b": "...", "option_c": "...", "option_d": "...", "correct": "A", "explanation": "..."}}
  ]
}}"""
    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    raw = call_gemini(contents)
    cleaned = re.sub(r'```json\s*|\s*```', '', raw).strip()
    try:
        quiz = json.loads(cleaned)
    except Exception:
        raise HTTPException(status_code=500, detail="AI returned an invalid format. Please try again.")
    return quiz
