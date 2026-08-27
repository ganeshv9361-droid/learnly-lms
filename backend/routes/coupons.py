from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import models, random, string

router = APIRouter()

class CouponIn(BaseModel):
    course_id: Optional[int] = None
    discount_percent: float
    max_uses: Optional[int] = 100
    expires_days: Optional[int] = 30

class ValidateIn(BaseModel):
    code: str
    course_id: int

def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

@router.post("/create")
def create_coupon(data: CouponIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    if data.discount_percent <= 0 or data.discount_percent > 100:
        raise HTTPException(status_code=400, detail="Discount must be 1-100%")
    from datetime import timedelta
    expires = datetime.now(timezone.utc) + timedelta(days=data.expires_days or 30)
    code = generate_code()
    while db.query(models.CouponCode).filter_by(code=code).first():
        code = generate_code()
    coupon = models.CouponCode(
        code=code,
        course_id=data.course_id,
        discount_percent=data.discount_percent,
        max_uses=data.max_uses,
        expires_at=expires,
        created_by=user.id
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon

@router.post("/validate")
def validate_coupon(data: ValidateIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    coupon = db.query(models.CouponCode).filter_by(code=data.code.upper()).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    if coupon.course_id and coupon.course_id != data.course_id:
        raise HTTPException(status_code=400, detail="Coupon not valid for this course")
    if coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="Coupon has expired (max uses reached)")
    if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Coupon has expired")
    course = db.query(models.Course).filter(models.Course.id == data.course_id).first()
    original_price = course.price if course else 0
    discount_amount = round(original_price * coupon.discount_percent / 100, 2)
    final_price = round(original_price - discount_amount, 2)
    return {
        "valid": True,
        "code": coupon.code,
        "discount_percent": coupon.discount_percent,
        "original_price": original_price,
        "discount_amount": discount_amount,
        "final_price": final_price
    }

@router.post("/apply/{code}")
def apply_coupon(code: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    coupon = db.query(models.CouponCode).filter_by(code=code.upper()).first()
    if coupon:
        coupon.used_count += 1
        db.commit()
    return {"message": "Applied"}

@router.get("/my")
def my_coupons(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    coupons = db.query(models.CouponCode).filter_by(created_by=user.id).all()
    result = []
    for c in coupons:
        course = db.query(models.Course).filter(models.Course.id == c.course_id).first() if c.course_id else None
        result.append({
            "id": c.id,
            "code": c.code,
            "course": course.title if course else "All courses",
            "discount_percent": c.discount_percent,
            "used_count": c.used_count,
            "max_uses": c.max_uses,
            "expires_at": c.expires_at
        })
    return result

@router.delete("/{coupon_id}")
def delete_coupon(coupon_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    c = db.query(models.CouponCode).filter_by(id=coupon_id, created_by=user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(c)
    db.commit()
    return {"message": "Deleted"}
