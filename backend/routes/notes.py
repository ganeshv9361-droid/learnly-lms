from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models

router = APIRouter()

class NoteIn(BaseModel):
    course_id: int
    video_id: Optional[int] = None
    content: str
    timestamp: Optional[float] = None

@router.post("/")
def create_note(data: NoteIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    note = models.StudentNote(
        user_id=user.id,
        course_id=data.course_id,
        video_id=data.video_id,
        content=data.content,
        timestamp=data.timestamp
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.get("/course/{course_id}")
def get_notes(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    notes = db.query(models.StudentNote).filter(
        models.StudentNote.user_id == user.id,
        models.StudentNote.course_id == course_id
    ).order_by(models.StudentNote.created_at.desc()).all()
    return notes

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    note = db.query(models.StudentNote).filter(
        models.StudentNote.id == note_id,
        models.StudentNote.user_id == user.id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(note)
    db.commit()
    return {"message": "Deleted"}
