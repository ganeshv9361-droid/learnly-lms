from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

def create_notification(db: Session, user_id: int, title: str, body: str, type: str = "general"):
    n = models.Notification(user_id=user_id, title=title, body=body, type=type)
    db.add(n)
    db.commit()

@router.get("/my")
def get_my_notifications(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == user.id
    ).order_by(models.Notification.created_at.desc()).limit(50).all()

@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), user=Depends(get_current_user)):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == user.id,
        models.Notification.read == False
    ).count()
    return {"count": count}

@router.patch("/mark-read/{notif_id}")
def mark_read(notif_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.user_id == user.id
    ).first()
    if n:
        n.read = True
        db.commit()
    return {"message": "Marked read"}

@router.patch("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user.id,
        models.Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "All marked read"}

@router.delete("/clear")
def clear_all(db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == user.id
    ).delete()
    db.commit()
    return {"message": "Cleared"}
