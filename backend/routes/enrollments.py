from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
import models

router = APIRouter()

class EnrollIn(BaseModel):
    course_id: int

class ProgressIn(BaseModel):
    progress: float

@router.post("/")
def enroll(data: EnrollIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    exists = db.query(models.Enrollment).filter_by(user_id=user.id, course_id=data.course_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Already enrolled")
    e = models.Enrollment(user_id=user.id, course_id=data.course_id)
    db.add(e)
    db.commit()
    db.refresh(e)
    return e

@router.get("/my")
def my_enrollments(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.Enrollment).filter(models.Enrollment.user_id == user.id).all()
    result = []
    for r in rows:
        course = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        result.append({
            "enrollment_id": r.id,
            "course_id": r.course_id,
            "course_title": course.title if course else "",
            "instructor": course.instructor if course else "",
            "total_modules": course.total_modules if course else 0,
            "progress": r.progress,
            "enrolled_at": r.enrolled_at
        })
    return result

@router.patch("/{enrollment_id}/progress")
def update_progress(enrollment_id: int, data: ProgressIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    e = db.query(models.Enrollment).filter_by(id=enrollment_id, user_id=user.id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    e.progress = data.progress
    db.commit()
    return {"progress": e.progress}
