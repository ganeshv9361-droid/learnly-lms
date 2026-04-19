from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
import models, json

router = APIRouter()

class QuestionIn(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct: str

class QuizIn(BaseModel):
    course_id: int
    title: str
    google_form_url: Optional[str] = None
    questions: Optional[List[QuestionIn]] = []

class AnswerIn(BaseModel):
    question_id: int
    answer: str

class AttemptIn(BaseModel):
    quiz_id: int
    answers: List[AnswerIn]

@router.post("/")
def create_quiz(data: QuizIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    quiz = models.Quiz(
        course_id=data.course_id,
        title=data.title,
        google_form_url=data.google_form_url,
        created_by=user.id
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    for q in data.questions:
        question = models.QuizQuestion(
            quiz_id=quiz.id,
            question=q.question,
            option_a=q.option_a,
            option_b=q.option_b,
            option_c=q.option_c,
            option_d=q.option_d,
            correct=q.correct.upper()
        )
        db.add(question)
    db.commit()
    return {"message": "Quiz created", "quiz_id": quiz.id}

@router.get("/course/{course_id}")
def get_quizzes(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    quizzes = db.query(models.Quiz).filter(models.Quiz.course_id == course_id).all()
    result = []
    for q in quizzes:
        questions = db.query(models.QuizQuestion).filter(
            models.QuizQuestion.quiz_id == q.id
        ).all()
        result.append({
            "id": q.id,
            "title": q.title,
            "course_id": q.course_id,
            "google_form_url": q.google_form_url,
            "question_count": len(questions),
            "created_at": q.created_at
        })
    return result

@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(quiz)
    db.commit()
    return {"message": "Deleted"}

@router.get("/{quiz_id}/questions")
def get_questions(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    already = db.query(models.QuizAttempt).filter_by(
        quiz_id=quiz_id, user_id=user.id
    ).first()
    if already and user.role == "student":
        raise HTTPException(status_code=400, detail="Already attempted this quiz")
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.quiz_id == quiz_id
    ).all()
    return [{"id":q.id,"question":q.question,"option_a":q.option_a,"option_b":q.option_b,"option_c":q.option_c,"option_d":q.option_d} for q in questions]

@router.post("/attempt")
def attempt_quiz(data: AttemptIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    already = db.query(models.QuizAttempt).filter_by(
        quiz_id=data.quiz_id, user_id=user.id
    ).first()
    if already:
        raise HTTPException(status_code=400, detail="Already attempted")
    questions = db.query(models.QuizQuestion).filter(
        models.QuizQuestion.quiz_id == data.quiz_id
    ).all()
    q_map = {q.id: q.correct for q in questions}
    score = sum(1 for ans in data.answers if q_map.get(ans.question_id,"").upper()==ans.answer.upper())
    attempt = models.QuizAttempt(
        quiz_id=data.quiz_id,
        user_id=user.id,
        score=score,
        total=len(questions),
        answers=json.dumps([a.dict() for a in data.answers])
    )
    db.add(attempt)
    db.commit()
    return {
        "score": score,
        "total": len(questions),
        "percentage": round(score/len(questions)*100,1) if questions else 0,
        "passed": score/len(questions)>=0.5 if questions else False
    }

@router.get("/my-attempts")
def my_attempts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id==user.id).all()
    result = []
    for r in rows:
        quiz = db.query(models.Quiz).filter(models.Quiz.id==r.quiz_id).first()
        course = db.query(models.Course).filter(models.Course.id==quiz.course_id).first() if quiz else None
        result.append({
            "id":r.id,"quiz_title":quiz.title if quiz else "","course":course.title if course else "",
            "score":r.score,"total":r.total,
            "percentage":round(r.score/r.total*100,1) if r.total else 0,
            "attempted_at":r.attempted_at
        })
    return result

@router.get("/results/{quiz_id}")
def quiz_results(quiz_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher","developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    attempts = db.query(models.QuizAttempt).filter(models.QuizAttempt.quiz_id==quiz_id).all()
    result = []
    for a in attempts:
        student = db.query(models.User).filter(models.User.id==a.user_id).first()
        result.append({
            "student_name":student.name if student else "",
            "student_email":student.email if student else "",
            "score":a.score,"total":a.total,
            "percentage":round(a.score/a.total*100,1) if a.total else 0,
            "attempted_at":a.attempted_at
        })
    return result