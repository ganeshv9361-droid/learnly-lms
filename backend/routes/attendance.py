from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
import models

router = APIRouter()

class AttendIn(BaseModel):
    course_id: int
    present: bool = True

@router.post("/")
def mark(data: AttendIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    a = models.Attendance(user_id=user.id, course_id=data.course_id, present=data.present)
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

@router.get("/my")
def my_attendance(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.Attendance).filter(models.Attendance.user_id == user.id).all()
    total = len(rows)
    present = sum(1 for r in rows if r.present)
    rate = round((present / total * 100), 1) if total else 0
    return {"total": total, "present": present, "rate": rate, "records": rows}
