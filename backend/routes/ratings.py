from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models

router = APIRouter()

class RatingIn(BaseModel):
    course_id: int
    rating: int
    review: Optional[str] = None

@router.post("/")
def add_rating(data: RatingIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")
    enrollment = db.query(models.Enrollment).filter_by(
        user_id=user.id, course_id=data.course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Enroll in course first")
    existing = db.query(models.CourseRating).filter_by(
        user_id=user.id, course_id=data.course_id
    ).first()
    if existing:
        existing.rating = data.rating
        existing.review = data.review
        db.commit()
        return {"message": "Rating updated"}
    r = models.CourseRating(
        user_id=user.id,
        course_id=data.course_id,
        rating=data.rating,
        review=data.review
    )
    db.add(r)
    db.commit()
    return {"message": "Rating added"}

@router.get("/course/{course_id}")
def get_ratings(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ratings = db.query(models.CourseRating).filter(
        models.CourseRating.course_id == course_id
    ).all()
    total = len(ratings)
    avg = round(sum(r.rating for r in ratings) / total, 1) if total else 0
    result = []
    for r in ratings:
        user = db.query(models.User).filter(models.User.id == r.user_id).first()
        result.append({
            "id": r.id,
            "user_name": user.name if user else "User",
            "rating": r.rating,
            "review": r.review,
            "created_at": r.created_at
        })
    return {"average": avg, "total": total, "ratings": result}

@router.get("/my/{course_id}")
def my_rating(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    r = db.query(models.CourseRating).filter_by(
        user_id=user.id, course_id=course_id
    ).first()
    if not r:
        return {"rating": 0, "review": ""}
    return {"rating": r.rating, "review": r.review or ""}
