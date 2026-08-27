from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

@router.get("/")
def get_leaderboard(db: Session = Depends(get_db), _=Depends(get_current_user)):
    students = db.query(models.User).filter(models.User.role == "student").all()
    result = []
    for s in students:
        certs = db.query(models.Certificate).filter_by(user_id=s.id).count()
        enrollments = db.query(models.Enrollment).filter_by(user_id=s.id).count()
        streak = db.query(models.StudyStreak).filter_by(user_id=s.id).first()
        attempts = db.query(models.QuizAttempt).filter_by(user_id=s.id).all()
        avg_score = round(
            sum(a.score/a.total*100 for a in attempts if a.total > 0)/len(attempts), 1
        ) if attempts else 0
        current_streak = streak.current_streak if streak else 0
        score = (certs * 100) + (current_streak * 10) + (enrollments * 5) + avg_score
        result.append({
            "id": s.id,
            "name": s.name,
            "certificates": certs,
            "enrollments": enrollments,
            "current_streak": current_streak,
            "avg_quiz_score": avg_score,
            "total_score": round(score, 1)
        })
    result.sort(key=lambda x: x["total_score"], reverse=True)
    for i, r in enumerate(result):
        r["rank"] = i + 1
    return result[:50]
