from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models

router = APIRouter()

class CourseIn(BaseModel):
    title: str
    description: Optional[str] = ""
    instructor: Optional[str] = ""
    total_modules: Optional[int] = 0
    is_paid: Optional[bool] = False
    price: Optional[float] = 0.0

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructor: Optional[str] = None
    total_modules: Optional[int] = None
    is_paid: Optional[bool] = None
    price: Optional[float] = None

@router.get("/")
def list_courses(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Course).all()

@router.post("/")
def create_course(data: CourseIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    course = models.Course(
        title=data.title,
        description=data.description,
        instructor=data.instructor or user.name,
        instructor_id=user.id,
        total_modules=data.total_modules,
        is_paid=data.is_paid,
        price=data.price
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course

@router.get("/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.patch("/{course_id}")
def update_course(course_id: int, data: CourseUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in data.dict(exclude_none=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}