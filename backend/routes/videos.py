from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models
import os

from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

load_dotenv()

router = APIRouter()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

class YoutubeIn(BaseModel):
    course_id: int
    title: str
    youtube_url: str
    order: Optional[int] = 0


@router.post("/youtube")
def add_youtube(
    data: YoutubeIn,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    video = models.Video(
        course_id=data.course_id,
        title=data.title,
        youtube_url=data.youtube_url,
        file_path=None,
        order=data.order
    )

    db.add(video)
    db.commit()
    db.refresh(video)

    return video


@router.post("/upload")
async def upload_video(
    course_id: int = Form(...),
    title: str = Form(...),
    order: int = Form(0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not cloud_name:
        raise HTTPException(status_code=500, detail="Cloudinary cloud name missing")

    if not api_key:
        raise HTTPException(status_code=500, detail="Cloudinary API key missing")

    if not api_secret:
        raise HTTPException(status_code=500, detail="Cloudinary API secret missing")

    try:
        result = cloudinary.uploader.upload_large(
            file.file,
            resource_type="video",
            folder="learnly/videos",
            overwrite=False
        )

        video_url = result.get("secure_url")

        if not video_url:
            raise HTTPException(status_code=500, detail="Cloudinary upload failed")

        # Convert video to browser-friendly MP4 format
        video_url = video_url.replace(
            "/video/upload/",
            "/video/upload/f_mp4,q_auto/"
        )

        video = models.Video(
            course_id=course_id,
            title=title,
            file_path=video_url,
            youtube_url=None,
            order=order
        )

        db.add(video)
        db.commit()
        db.refresh(video)

        return video

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video upload failed: {str(e)}")


@router.get("/course/{course_id}")
def get_videos(
    course_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    return db.query(models.Video).filter(
        models.Video.course_id == course_id
    ).order_by(models.Video.order).all()


@router.delete("/{video_id}")
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    db.delete(video)
    db.commit()

    return {"message": "Deleted"}