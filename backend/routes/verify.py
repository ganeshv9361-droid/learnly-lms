from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter()

@router.get("/{cert_id}")
def verify_certificate(cert_id: int, db: Session = Depends(get_db)):
    cert = db.query(models.Certificate).filter(models.Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    user = db.query(models.User).filter(models.User.id == cert.user_id).first()
    course = db.query(models.Course).filter(models.Course.id == cert.course_id).first()
    return {
        "valid": True,
        "student_name": user.name if user else "",
        "course_title": course.title if course else "",
        "issued_at": cert.issued_at,
        "verified": cert.verified,
        "certificate_id": cert.id
    }
