from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
import models

router = APIRouter()

class WishlistIn(BaseModel):
    course_id: int

@router.post("/add")
def add_to_wishlist(data: WishlistIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    existing = db.query(models.Wishlist).filter_by(
        user_id=user.id, course_id=data.course_id
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Removed from wishlist", "wishlisted": False}
    w = models.Wishlist(user_id=user.id, course_id=data.course_id)
    db.add(w)
    db.commit()
    return {"message": "Added to wishlist", "wishlisted": True}

@router.get("/my")
def my_wishlist(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = db.query(models.Wishlist).filter_by(user_id=user.id).all()
    result = []
    for item in items:
        course = db.query(models.Course).filter(models.Course.id == item.course_id).first()
        if course:
            result.append({
                "id": item.id,
                "course_id": course.id,
                "title": course.title,
                "instructor": course.instructor,
                "is_paid": course.is_paid,
                "price": course.price,
                "description": course.description
            })
    return result

@router.get("/check/{course_id}")
def check_wishlist(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    exists = db.query(models.Wishlist).filter_by(
        user_id=user.id, course_id=course_id
    ).first()
    return {"wishlisted": bool(exists)}
