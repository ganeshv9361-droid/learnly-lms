from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models

router = APIRouter()

class AssessIn(BaseModel):
    course_id: int
    title: str
    score: float
    max_score: Optional[float] = 100.0

@router.post("/")
def submit(data: AssessIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = models.Assessment(user_id=user.id, **data.dict())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

@router.get("/my")
def my_assessments(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.Assessment).filter(models.Assessment.user_id == user.id).all()
    result = []
    for r in rows:
        course = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        result.append({
            "id": r.id,
            "title": r.title,
            "course": course.title if course else "",
            "score": r.score,
            "max_score": r.max_score,
            "percentage": round(r.score / r.max_score * 100, 1),
            "taken_at": r.taken_at
        })
    return result
