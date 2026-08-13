from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import models, os, cloudinary, cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "dnf3yhfz0"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "865847252129784"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "swDMsf-5JBoLlQbrK0XcNgXSDmM")
)

router = APIRouter()

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
        raise HTTPException(status_code=400, detail=f"Format {ext} not supported. Use mp4, mov, webm")
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            resource_type="video",
            folder="learnly/videos",
            public_id=f"video_{course_id}_{title[:20].replace(' ','_')}",
            overwrite=False,
            eager=[{"streaming_profile": "auto", "format": "m3u8"}],
            eager_async=True
        )
        file_path = result["secure_url"]
        thumbnail_url = result.get("secure_url", "").replace("/upload/", "/upload/so_0/").replace(f".{result.get('format','mp4')}", ".jpg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    video = models.Video(
        course_id=course_id,
        title=title,
        file_path=file_path,
        youtube_url=None,
        thumbnail_url=thumbnail_url,
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
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(
            contents,
            resource_type="image",
            folder="learnly/thumbnails",
            transformation=[{"width": 640, "height": 360, "crop": "fill"}]
        )
        video.thumbnail_url = result["secure_url"]
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thumbnail upload failed: {str(e)}")
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
    if video.file_path and "cloudinary" in video.file_path:
        try:
            public_id = video.file_path.split("/upload/")[1].rsplit(".", 1)[0]
            cloudinary.uploader.destroy(public_id, resource_type="video")
        except Exception:
            pass
    db.delete(video)
    db.commit()
    return {"message": "Deleted"}
