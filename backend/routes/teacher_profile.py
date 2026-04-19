from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import models

router = APIRouter()

class ProfileIn(BaseModel):
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    office_hours: Optional[str] = None
    bio: Optional[str] = None

class BankIn(BaseModel):
    bank_account_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    upi_id: Optional[str] = None

def get_or_create_profile(db: Session, user_id: int):
    profile = db.query(models.TeacherProfile).filter_by(user_id=user_id).first()
    if not profile:
        profile = models.TeacherProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.get("/my-profile")
def get_my_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    profile = get_or_create_profile(db, user.id)
    return {
        "id": profile.id,
        "phone": profile.phone,
        "whatsapp": profile.whatsapp,
        "office_hours": profile.office_hours,
        "bio": profile.bio,
        "bank_account_name": profile.bank_account_name,
        "bank_account_number": f"****{profile.bank_account_number[-4:]}" if profile.bank_account_number and len(profile.bank_account_number) >= 4 else None,
        "bank_ifsc": profile.bank_ifsc,
        "bank_name": profile.bank_name,
        "upi_id": profile.upi_id,
        "payout_pending": profile.payout_pending,
        "payout_total": profile.payout_total,
        "has_bank": bool(profile.bank_account_number or profile.upi_id)
    }

@router.patch("/contact")
def update_contact(data: ProfileIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    profile = get_or_create_profile(db, user.id)
    for field, value in data.dict(exclude_none=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Contact updated"}

@router.patch("/bank")
def update_bank(data: BankIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    profile = get_or_create_profile(db, user.id)
    for field, value in data.dict(exclude_none=True).items():
        setattr(profile, field, value)
    profile.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Bank details saved"}

@router.get("/course/{course_id}/teacher-contact")
def get_teacher_contact(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    enrollment = db.query(models.Enrollment).filter_by(
        user_id=user.id, course_id=course_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="Enroll first to see teacher contact")
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course or not course.instructor_id:
        raise HTTPException(status_code=404, detail="Teacher not found")
    teacher = db.query(models.User).filter(models.User.id == course.instructor_id).first()
    profile = db.query(models.TeacherProfile).filter_by(user_id=course.instructor_id).first()
    return {
        "teacher_name": teacher.name if teacher else "",
        "teacher_email": teacher.email if teacher else "",
        "phone": profile.phone if profile else None,
        "whatsapp": profile.whatsapp if profile else None,
        "office_hours": profile.office_hours if profile else None,
        "bio": profile.bio if profile else None
    }

@router.get("/payout-summary")
def payout_summary(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    my_courses = db.query(models.Course).filter(
        models.Course.instructor_id == user.id
    ).all()
    course_ids = [c.id for c in my_courses]
    payments = db.query(models.Payment).filter(
        models.Payment.course_id.in_(course_ids),
        models.Payment.status == "paid"
    ).all()
    total_earned = sum(p.teacher_amount for p in payments)
    pending = sum(p.teacher_amount for p in payments if not p.teacher_paid)
    settled = sum(p.teacher_amount for p in payments if p.teacher_paid)
    breakdown = []
    for p in payments:
        course = db.query(models.Course).filter(models.Course.id == p.course_id).first()
        student = db.query(models.User).filter(models.User.id == p.user_id).first()
        breakdown.append({
            "course": course.title if course else "",
            "student": student.name if student else "",
            "amount": p.amount,
            "platform_fee": p.platform_fee,
            "your_share": p.teacher_amount,
            "settled": p.teacher_paid,
            "date": p.created_at
        })
    return {
        "total_earned": total_earned,
        "pending_payout": pending,
        "settled": settled,
        "transactions": breakdown
    }
