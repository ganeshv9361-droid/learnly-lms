from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models, os, shutil, uuid

router = APIRouter()
UPLOAD_DIR = "uploads"
THUMB_DIR = "uploads/thumbnails"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(THUMB_DIR, exist_ok=True)

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
    allowed = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.m4v']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {ext} not allowed. Use mp4, avi, mov, mkv, webm")
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    try:
        with open(filepath, "wb") as f:
            while chunk := await file.read(1024 * 1024):
                f.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
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

@router.post("/upload-thumbnail/{video_id}")
async def upload_thumbnail(
    video_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    video = db.query(models.Video).filter(models.Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"thumb_{uuid.uuid4()}{ext}"
    filepath = os.path.join(THUMB_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    if video.thumbnail_url:
        old = video.thumbnail_url.lstrip("/")
        if os.path.exists(old):
            os.remove(old)
    video.thumbnail_url = f"/uploads/thumbnails/{filename}"
    db.commit()
    db.refresh(video)
    return {"thumbnail_url": video.thumbnail_url}

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
    if video.thumbnail_url:
        local = video.thumbnail_url.lstrip("/")
        if os.path.exists(local):
            os.remove(local)
    db.delete(video)
    db.commit()
    return {"message": "Deleted"}