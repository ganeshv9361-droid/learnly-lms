from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
import models

router = APIRouter()

class AnnouncementIn(BaseModel):
    course_id: int
    title: str
    body: str

@router.post("/")
def create(data: AnnouncementIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    a = models.Announcement(
        course_id=data.course_id,
        title=data.title,
        body=data.body,
        created_by=user.id
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

@router.get("/course/{course_id}")
def get_by_course(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Announcement).filter(
        models.Announcement.course_id == course_id
    ).order_by(models.Announcement.created_at.desc()).all()

@router.get("/my")
def my_announcements(db: Session = Depends(get_db), user=Depends(get_current_user)):
    enrolled = db.query(models.Enrollment).filter(models.Enrollment.user_id == user.id).all()
    course_ids = [e.course_id for e in enrolled]
    announcements = db.query(models.Announcement).filter(
        models.Announcement.course_id.in_(course_ids)
    ).order_by(models.Announcement.created_at.desc()).all()
    result = []
    for a in announcements:
        course = db.query(models.Course).filter(models.Course.id == a.course_id).first()
        result.append({
            "id": a.id,
            "title": a.title,
            "body": a.body,
            "course": course.title if course else "",
            "created_at": a.created_at
        })
    return result

@router.delete("/{announcement_id}")
def delete(announcement_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    a = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(a)
    db.commit()
    return {"message": "Deleted"}
