from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from datetime import datetime, timezone, timedelta
import models

router = APIRouter()

def update_streak(db: Session, user_id: int):
    today = datetime.now(timezone.utc).date()
    streak = db.query(models.StudyStreak).filter_by(user_id=user_id).first()
    if not streak:
        streak = models.StudyStreak(
            user_id=user_id,
            current_streak=1,
            longest_streak=1,
            last_study_date=datetime.now(timezone.utc),
            total_days=1
        )
        db.add(streak)
        db.commit()
        return streak
    if streak.last_study_date:
        last_date = streak.last_study_date.date()
        if last_date == today:
            return streak
        elif last_date == today - timedelta(days=1):
            streak.current_streak += 1
            streak.total_days += 1
        else:
            streak.current_streak = 1
            streak.total_days += 1
    else:
        streak.current_streak = 1
        streak.total_days += 1
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.last_study_date = datetime.now(timezone.utc)
    streak.updated_at = datetime.now(timezone.utc)
    db.commit()
    return streak

@router.post("/study")
def mark_study(db: Session = Depends(get_db), user=Depends(get_current_user)):
    streak = update_streak(db, user.id)
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "total_days": streak.total_days,
        "message": f"🔥 {streak.current_streak} day streak!"
    }

@router.get("/my")
def my_streak(db: Session = Depends(get_db), user=Depends(get_current_user)):
    streak = db.query(models.StudyStreak).filter_by(user_id=user.id).first()
    if not streak:
        return {"current_streak": 0, "longest_streak": 0, "total_days": 0}
    return {
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "total_days": streak.total_days
    }
