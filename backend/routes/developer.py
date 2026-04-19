from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import models

router = APIRouter()

def dev_only(user=Depends(get_current_user)):
    if user.role != "developer":
        raise HTTPException(status_code=403, detail="Developer only")
    return user

class FeeIn(BaseModel):
    platform_fee: float

class SettleIn(BaseModel):
    payment_ids: list[int]

def get_platform_fee(db: Session) -> float:
    setting = db.query(models.PlatformSettings).filter_by(key="platform_fee").first()
    if not setting:
        setting = models.PlatformSettings(key="platform_fee", value="5.0")
        db.add(setting)
        db.commit()
    return float(setting.value)

@router.get("/stats")
def dev_stats(db: Session = Depends(get_db), _=Depends(dev_only)):
    users = db.query(models.User).all()
    courses = db.query(models.Course).all()
    enrollments = db.query(models.Enrollment).all()
    payments = db.query(models.Payment).filter(models.Payment.status == "paid").all()
    certificates = db.query(models.Certificate).all()
    platform_fee = get_platform_fee(db)
    total_revenue = sum(p.amount for p in payments)
    platform_earnings = sum(p.platform_fee for p in payments)
    return {
        "total_users": len(users),
        "total_students": len([u for u in users if u.role == "student"]),
        "total_teachers": len([u for u in users if u.role == "teacher"]),
        "total_courses": len(courses),
        "total_enrollments": len(enrollments),
        "total_revenue": total_revenue,
        "platform_earnings": platform_earnings,
        "total_certificates": len(certificates),
        "platform_fee": platform_fee,
        "recent_users": [{
            "id": u.id, "name": u.name, "email": u.email,
            "role": u.role, "created_at": u.created_at
        } for u in sorted(users, key=lambda x: x.created_at, reverse=True)[:10]]
    }

@router.get("/users")
def all_users(db: Session = Depends(get_db), _=Depends(dev_only)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.user_id == u.id
        ).count()
        payments = db.query(models.Payment).filter(
            models.Payment.user_id == u.id,
            models.Payment.status == "paid"
        ).all()
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "enrollments": enrollments,
            "total_spent": sum(p.amount for p in payments),
            "referral_code": u.referral_code,
            "created_at": u.created_at
        })
    return result

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), user=Depends(dev_only)):
    if user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    db.query(models.Enrollment).filter(models.Enrollment.user_id == user_id).delete()
    db.query(models.Attendance).filter(models.Attendance.user_id == user_id).delete()
    db.query(models.Assessment).filter(models.Assessment.user_id == user_id).delete()
    db.query(models.Certificate).filter(models.Certificate.user_id == user_id).delete()
    db.query(models.AssignmentSubmission).filter(models.AssignmentSubmission.user_id == user_id).delete()
    db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == user_id).delete()
    db.query(models.Payment).filter(models.Payment.user_id == user_id).delete()
    db.query(models.VideoWatch).filter(models.VideoWatch.user_id == user_id).delete()
    db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user_id).delete()
    db.delete(target)
    db.commit()
    return {"message": f"User {target.name} deleted"}

@router.patch("/users/{user_id}/role")
def change_role(user_id: int, role: str, db: Session = Depends(get_db), _=Depends(dev_only)):
    if role not in ["student", "teacher", "developer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"message": f"Role updated to {role}"}

@router.get("/platform-fee")
def get_fee(db: Session = Depends(get_db), _=Depends(dev_only)):
    return {"platform_fee": get_platform_fee(db)}

@router.patch("/platform-fee")
def update_fee(data: FeeIn, db: Session = Depends(get_db), _=Depends(dev_only)):
    if data.platform_fee < 0:
        raise HTTPException(status_code=400, detail="Fee cannot be negative")
    setting = db.query(models.PlatformSettings).filter_by(key="platform_fee").first()
    if not setting:
        setting = models.PlatformSettings(key="platform_fee", value=str(data.platform_fee))
        db.add(setting)
    else:
        setting.value = str(data.platform_fee)
        setting.updated_at = datetime.utcnow()
    db.commit()
    return {"platform_fee": data.platform_fee, "message": "Platform fee updated"}

@router.get("/settlements")
def all_settlements(db: Session = Depends(get_db), _=Depends(dev_only)):
    payments = db.query(models.Payment).filter(models.Payment.status == "paid").all()
    result = []
    for p in payments:
        course = db.query(models.Course).filter(models.Course.id == p.course_id).first()
        student = db.query(models.User).filter(models.User.id == p.user_id).first()
        teacher = None
        if course and course.instructor_id:
            teacher = db.query(models.User).filter(models.User.id == course.instructor_id).first()
        teacher_profile = None
        if course and course.instructor_id:
            teacher_profile = db.query(models.TeacherProfile).filter_by(
                user_id=course.instructor_id
            ).first()
        result.append({
            "payment_id": p.id,
            "course": course.title if course else "",
            "student": student.name if student else "",
            "teacher": teacher.name if teacher else "",
            "teacher_upi": teacher_profile.upi_id if teacher_profile else None,
            "teacher_account": teacher_profile.bank_account_number if teacher_profile else None,
            "teacher_ifsc": teacher_profile.bank_ifsc if teacher_profile else None,
            "total_amount": p.amount,
            "platform_fee": p.platform_fee,
            "teacher_amount": p.teacher_amount,
            "teacher_paid": p.teacher_paid,
            "date": p.created_at
        })
    return result

@router.patch("/settlements/{payment_id}/mark-settled")
def mark_settled(payment_id: int, db: Session = Depends(get_db), _=Depends(dev_only)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.teacher_paid = True
    if payment.course and payment.course.instructor_id:
        profile = db.query(models.TeacherProfile).filter_by(
            user_id=payment.course.instructor_id
        ).first()
        if profile:
            profile.payout_total += payment.teacher_amount
            if profile.payout_pending >= payment.teacher_amount:
                profile.payout_pending -= payment.teacher_amount
    db.commit()
    return {"message": "Marked as settled"}

@router.get("/platform-earnings")
def platform_earnings(db: Session = Depends(get_db), _=Depends(dev_only)):
    payments = db.query(models.Payment).filter(models.Payment.status == "paid").all()
    total = sum(p.platform_fee for p in payments)
    monthly = {}
    for p in payments:
        key = p.created_at.strftime("%b %Y")
        monthly[key] = monthly.get(key, 0) + p.platform_fee
    return {
        "total_platform_earnings": total,
        "monthly": monthly,
        "transactions": len(payments)
    }