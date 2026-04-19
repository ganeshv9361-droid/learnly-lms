from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
import models
from routes.teacher import check_and_issue_certificate

router = APIRouter()

class WatchIn(BaseModel):
    video_id: int
    course_id: int

@router.post("/mark-watched")
def mark_watched(data: WatchIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(models.VideoWatch).filter_by(
        user_id=user.id, video_id=data.video_id
    ).first()
    if not existing:
        w = models.VideoWatch(
            user_id=user.id,
            video_id=data.video_id,
            course_id=data.course_id
        )
        db.add(w)
        db.commit()
    all_videos = db.query(models.Video).filter(
        models.Video.course_id == data.course_id
    ).all()
    watched = db.query(models.VideoWatch).filter_by(
        user_id=user.id, course_id=data.course_id
    ).all()
    watched_count = len(watched)
    total = len(all_videos)
    if total > 0:
        progress = round(watched_count / total * 100, 1)
        enrollment = db.query(models.Enrollment).filter_by(
            user_id=user.id, course_id=data.course_id
        ).first()
        if enrollment and enrollment.progress < 100:
            enrollment.progress = min(progress, 99)
            db.commit()
    check_and_issue_certificate(db, user.id, data.course_id)
    watched_ids = [w.video_id for w in watched]
    if not existing:
        watched_ids.append(data.video_id)
    return {
        "watched": watched_ids,
        "total": total,
        "progress": round(len(watched_ids) / total * 100, 1) if total else 0
    }

@router.get("/watched/{course_id}")
def get_watched(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    watched = db.query(models.VideoWatch).filter_by(
        user_id=user.id, course_id=course_id
    ).all()
    return {"watched_ids": [w.video_id for w in watched]}
