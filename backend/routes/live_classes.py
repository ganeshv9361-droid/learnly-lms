from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime, timezone
import models

router = APIRouter()

class LiveClassIn(BaseModel):
    course_id: int
    title: str
    meet_link: str
    scheduled_at: str
    duration_mins: int = 60

@router.post("/")
def create_live_class(data: LiveClassIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    scheduled = datetime.fromisoformat(data.scheduled_at.replace('Z', '+00:00'))
    lc = models.LiveClass(
        course_id=data.course_id,
        title=data.title,
        meet_link=data.meet_link,
        scheduled_at=scheduled,
        duration_mins=data.duration_mins,
        created_by=user.id
    )
    db.add(lc)
    db.commit()
    db.refresh(lc)
    enrollments = db.query(models.Enrollment).filter_by(course_id=data.course_id).all()
    from routes.notifications import create_notification
    course = db.query(models.Course).filter(models.Course.id == data.course_id).first()
    for e in enrollments:
        create_notification(
            db, e.user_id,
            f"📹 Live Class: {data.title}",
            f"{course.title if course else ''} — Join at {data.meet_link}",
            "live_class"
        )
    return lc

@router.get("/course/{course_id}")
def get_live_classes(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    classes = db.query(models.LiveClass).filter(
        models.LiveClass.course_id == course_id
    ).order_by(models.LiveClass.scheduled_at.desc()).all()
    return classes

@router.get("/upcoming")
def upcoming_classes(db: Session = Depends(get_db), user=Depends(get_current_user)):
    enrollments = db.query(models.Enrollment).filter_by(user_id=user.id).all()
    course_ids = [e.course_id for e in enrollments]
    now = datetime.now(timezone.utc)
    classes = db.query(models.LiveClass).filter(
        models.LiveClass.course_id.in_(course_ids),
        models.LiveClass.scheduled_at >= now
    ).order_by(models.LiveClass.scheduled_at).limit(5).all()
    result = []
    for c in classes:
        course = db.query(models.Course).filter(models.Course.id == c.course_id).first()
        result.append({
            "id": c.id,
            "title": c.title,
            "course": course.title if course else "",
            "meet_link": c.meet_link,
            "scheduled_at": c.scheduled_at,
            "duration_mins": c.duration_mins
        })
    return result

@router.delete("/{class_id}")
def delete_live_class(class_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    lc = db.query(models.LiveClass).filter_by(id=class_id).first()
    if not lc:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(lc)
    db.commit()
    return {"message": "Deleted"}
