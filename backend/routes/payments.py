from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
import models, razorpay, os, hmac, hashlib
from dotenv import load_dotenv

load_dotenv()
KEY_ID = os.getenv("RAZORPAY_KEY_ID")
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
router = APIRouter()

def get_platform_fee(db: Session) -> float:
    setting = db.query(models.PlatformSettings).filter_by(key="platform_fee").first()
    if not setting:
        setting = models.PlatformSettings(key="platform_fee", value="5.0")
        db.add(setting)
        db.commit()
    return float(setting.value)

class OrderIn(BaseModel):
    course_id: int

class VerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    course_id: int

@router.post("/create-order")
def create_order(data: OrderIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if not course.is_paid:
        raise HTTPException(status_code=400, detail="Course is free")
    already = db.query(models.Enrollment).filter_by(
        user_id=user.id, course_id=data.course_id
    ).first()
    if already:
        raise HTTPException(status_code=400, detail="Already enrolled")
    platform_fee = get_platform_fee(db)
    teacher_amount = max(0, course.price - platform_fee)
    amount_paise = int(course.price * 100)
    order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"order_{user.id}_{course.id}",
        "notes": {"course_id": str(course.id), "user_id": str(user.id)}
    })
    payment = models.Payment(
        user_id=user.id,
        course_id=course.id,
        amount=course.price,
        platform_fee=platform_fee,
        teacher_amount=teacher_amount,
        razorpay_order_id=order["id"],
        status="created"
    )
    db.add(payment)
    if course.instructor_id:
        profile = db.query(models.TeacherProfile).filter_by(
            user_id=course.instructor_id
        ).first()
        if not profile:
            profile = models.TeacherProfile(user_id=course.instructor_id, payout_pending=0.0, payout_total=0.0)
            db.add(profile)
        profile.payout_pending += teacher_amount
    db.commit()
    return {
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": KEY_ID,
        "course_title": course.title,
        "user_name": user.name,
        "user_email": user.email,
        "platform_fee": platform_fee,
        "teacher_amount": teacher_amount
    }

@router.post("/verify")
def verify_payment(data: VerifyIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    body = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected = hmac.new(
        KEY_SECRET.encode(), body.encode(), hashlib.sha256
    ).hexdigest()
    if expected != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    payment = db.query(models.Payment).filter(
        models.Payment.razorpay_order_id == data.razorpay_order_id
    ).first()
    if payment:
        payment.status = "paid"
        payment.razorpay_payment_id = data.razorpay_payment_id
        db.commit()
    existing = db.query(models.Enrollment).filter_by(
        user_id=user.id, course_id=data.course_id
    ).first()
    if not existing:
        enrollment = models.Enrollment(user_id=user.id, course_id=data.course_id, progress=0.0)
        db.add(enrollment)
        db.commit()
    return {"message": "Payment successful", "enrolled": True}

@router.get("/my-orders")
def my_orders(db: Session = Depends(get_db), user=Depends(get_current_user)):
    payments = db.query(models.Payment).filter(models.Payment.user_id == user.id).all()
    result = []
    for p in payments:
        course = db.query(models.Course).filter(models.Course.id == p.course_id).first()
        result.append({
            "id": p.id,
            "course": course.title if course else "",
            "amount": p.amount,
            "platform_fee": p.platform_fee,
            "status": p.status,
            "razorpay_payment_id": p.razorpay_payment_id,
            "created_at": p.created_at
        })
    return result

@router.get("/revenue")
def revenue(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    payments = db.query(models.Payment).filter(models.Payment.status == "paid").all()
    total = sum(p.amount for p in payments)
    monthly = {}
    for p in payments:
        key = p.created_at.strftime("%b %Y")
        monthly[key] = monthly.get(key, 0) + p.amount
    course_revenue = {}
    for p in payments:
        course = db.query(models.Course).filter(models.Course.id == p.course_id).first()
        name = course.title if course else "Unknown"
        course_revenue[name] = course_revenue.get(name, 0) + p.amount
    return {
        "total_revenue": total,
        "total_paid": len(payments),
        "monthly": monthly,
        "by_course": course_revenue
    }