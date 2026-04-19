from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, verify_password, create_token, get_current_user
from pydantic import BaseModel
from typing import Optional
import models, uuid

router = APIRouter()

class RegisterIn(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"
    referral_code: Optional[str] = None

class UpdateProfileIn(BaseModel):
    name: Optional[str] = None

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str

@router.post("/register")
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    referrer = None
    if data.referral_code:
        referrer = db.query(models.User).filter(models.User.referral_code == data.referral_code).first()
    user = models.User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        referral_code=str(uuid.uuid4())[:8].upper(),
        referred_by=referrer.id if referrer else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if referrer:
        ref = models.Referral(referrer_id=referrer.id, referred_id=user.id)
        db.add(ref)
        db.commit()
    return {"message": "Registered successfully", "id": user.id}

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name}

@router.get("/me")
def me(current_user=Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "referral_code": current_user.referral_code,
        "created_at": current_user.created_at
    }

@router.patch("/me")
def update_profile(data: UpdateProfileIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if data.name:
        user.name = data.name
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}

@router.patch("/me/password")
def change_password(data: ChangePasswordIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not verify_password(data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/all")
def all_users(db: Session = Depends(get_db), _=Depends(get_current_user)):
    users = db.query(models.User).all()
    result = []
    for u in users:
        enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == u.id).all()
        enroll_details = []
        for e in enrollments:
            course = db.query(models.Course).filter(models.Course.id == e.course_id).first()
            enroll_details.append({"course_title": course.title if course else "", "progress": e.progress})
        assessments = db.query(models.Assessment).filter(models.Assessment.user_id == u.id).all()
        avg_score = round(sum(a.score/a.max_score*100 for a in assessments)/len(assessments),1) if assessments else 0
        att = db.query(models.Attendance).filter(models.Attendance.user_id == u.id).all()
        att_rate = round(sum(1 for a in att if a.present)/len(att)*100,1) if att else 0
        result.append({
            "id": u.id, "name": u.name, "email": u.email, "role": u.role,
            "created_at": u.created_at, "enrollments": enroll_details,
            "avg_score": avg_score, "attendance_rate": att_rate,
            "certificates": db.query(models.Certificate).filter(models.Certificate.user_id == u.id).count()
        })
    return result