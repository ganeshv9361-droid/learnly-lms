from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models

router = APIRouter()

class DiscussionIn(BaseModel):
    course_id: int
    message: str
    parent_id: Optional[int] = None

@router.post("/")
def post_message(data: DiscussionIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    enrollment = db.query(models.Enrollment).filter_by(
        user_id=user.id, course_id=data.course_id
    ).first()
    teacher_course = db.query(models.Course).filter_by(
        id=data.course_id, instructor_id=user.id
    ).first()
    if not enrollment and not teacher_course and user.role != "developer":
        raise HTTPException(status_code=403, detail="Enroll first")
    d = models.Discussion(
        course_id=data.course_id,
        user_id=user.id,
        message=data.message,
        parent_id=data.parent_id
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return {"id": d.id, "message": d.message, "created_at": d.created_at}

@router.get("/course/{course_id}")
def get_discussions(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    discussions = db.query(models.Discussion).filter(
        models.Discussion.course_id == course_id,
        models.Discussion.parent_id == None
    ).order_by(models.Discussion.created_at.desc()).all()
    result = []
    for d in discussions:
        user = db.query(models.User).filter(models.User.id == d.user_id).first()
        replies = db.query(models.Discussion).filter(
            models.Discussion.parent_id == d.id
        ).all()
        reply_list = []
        for r in replies:
            ru = db.query(models.User).filter(models.User.id == r.user_id).first()
            reply_list.append({
                "id": r.id,
                "user_name": ru.name if ru else "User",
                "user_role": ru.role if ru else "student",
                "message": r.message,
                "created_at": r.created_at
            })
        result.append({
            "id": d.id,
            "user_name": user.name if user else "User",
            "user_role": user.role if user else "student",
            "message": d.message,
            "created_at": d.created_at,
            "replies": reply_list
        })
    return result

@router.delete("/{discussion_id}")
def delete_message(discussion_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    d = db.query(models.Discussion).filter(models.Discussion.id == discussion_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    if d.user_id != user.id and user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(d)
    db.commit()
    return {"message": "Deleted"}
