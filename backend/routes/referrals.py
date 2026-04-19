from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models, uuid

router = APIRouter()

@router.get("/my-code")
def my_referral_code(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not user.referral_code:
        user.referral_code = str(uuid.uuid4())[:8].upper()
        db.commit()
        db.refresh(user)
    return {
        "referral_code": user.referral_code,
        "referral_link": f"http://localhost:5173/register?ref={user.referral_code}",
        "total_referrals": db.query(models.Referral).filter(
            models.Referral.referrer_id == user.id
        ).count()
    }

@router.get("/my-list")
def my_referrals(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.Referral).filter(models.Referral.referrer_id == user.id).all()
    result = []
    for r in rows:
        referred = db.query(models.User).filter(models.User.id == r.referred_id).first()
        result.append({
            "name": referred.name if referred else "",
            "email": referred.email if referred else "",
            "joined": r.created_at
        })
    return result
