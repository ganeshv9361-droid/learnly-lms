from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
import models

router = APIRouter()

class CertIn(BaseModel):
    course_id: int

@router.post("/")
def issue(data: CertIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    exists = db.query(models.Certificate).filter_by(user_id=user.id, course_id=data.course_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Certificate already issued")
    c = models.Certificate(user_id=user.id, course_id=data.course_id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.get("/my")
def my_certs(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.Certificate).filter(models.Certificate.user_id == user.id).all()
    result = []
    for r in rows:
        course = db.query(models.Course).filter(models.Course.id == r.course_id).first()
        result.append({
            "id": r.id,
            "course": course.title if course else "",
            "issued_at": r.issued_at,
            "verified": r.verified
        })
    return result
