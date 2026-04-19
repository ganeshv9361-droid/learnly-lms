from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models, os, shutil, uuid

router = APIRouter()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class YoutubeIn(BaseModel):
    course_id: int
    title: str
    youtube_url: str
    order: Optional[int] = 0

@router.post("/youtube")
def add_youtube(data: YoutubeIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
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
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".mp4"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    video = models.Video(
        course_id=course_id,
        title=title,
        file_path=f"/uploads/{filename}",
        youtube_url=None,
        order=order
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video

@router.get("/course/{course_id}")
def get_videos(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Video).filter(
        models.Video.course_id == course_id
    ).order_by(models.Video.order).all()

@router.delete("/{video_id}")
def delete_video(video_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.file_path:
        local = video.file_path.lstrip("/")
        if os.path.exists(local):
            os.remove(local)
    db.delete(video)
    db.commit()
    return {"message": "Deleted"}