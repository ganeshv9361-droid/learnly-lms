from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import models, cloudinary, cloudinary.uploader, os

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dnf3yhfz0"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "865847252129784"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "swDMsf-5JBoLlQbrK0XcNgXSDmM")
)

router = APIRouter()

class ProfileIn(BaseModel):
    bio: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None

def get_or_create(db, user_id):
    p = db.query(models.UserProfile).filter_by(user_id=user_id).first()
    if not p:
        p = models.UserProfile(user_id=user_id)
        db.add(p)
        db.commit()
        db.refresh(p)
    return p

@router.get("/my")
def get_my_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = get_or_create(db, user.id)
    return {
        "id": p.id,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "avatar_url": p.avatar_url,
        "bio": p.bio,
        "linkedin": p.linkedin,
        "twitter": p.twitter,
        "website": p.website
    }

@router.patch("/update")
def update_profile(data: ProfileIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = get_or_create(db, user.id)
    for field, value in data.dict(exclude_none=True).items():
        setattr(p, field, value)
    p.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Profile updated"}

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    contents = await file.read()
    result = cloudinary.uploader.upload(
        contents,
        resource_type="image",
        folder="learnly/avatars",
        public_id=f"avatar_{user.id}",
        overwrite=True,
        transformation=[{"width": 200, "height": 200, "crop": "fill", "radius": "max"}]
    )
    p = get_or_create(db, user.id)
    p.avatar_url = result["secure_url"]
    db.commit()
    return {"avatar_url": result["secure_url"]}

@router.get("/public/{user_id}")
def get_public_profile(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    p = db.query(models.UserProfile).filter_by(user_id=user_id).first()
    certs = db.query(models.Certificate).filter_by(user_id=user_id).count()
    enrollments = db.query(models.Enrollment).filter_by(user_id=user_id).count()
    streak = db.query(models.StudyStreak).filter_by(user_id=user_id).first()
    return {
        "name": user.name,
        "avatar_url": p.avatar_url if p else None,
        "bio": p.bio if p else None,
        "linkedin": p.linkedin if p else None,
        "twitter": p.twitter if p else None,
        "website": p.website if p else None,
        "certificates": certs,
        "enrollments": enrollments,
        "streak": streak.current_streak if streak else 0
    }
