from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import models, os, shutil, uuid

router = APIRouter()
UPLOAD_DIR = "uploads/assignments"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AssignmentIn(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None
    google_form_url: Optional[str] = None

class GradeIn(BaseModel):
    grade: float
    feedback: Optional[str] = ""

@router.post("/")
def create_assignment(data: AssignmentIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    due = datetime.fromisoformat(data.due_date) if data.due_date else None
    a = models.Assignment(
        course_id=data.course_id,
        title=data.title,
        description=data.description,
        due_date=due,
        google_form_url=data.google_form_url,
        created_by=user.id
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a

@router.get("/course/{course_id}")
def get_assignments(course_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Assignment).filter(models.Assignment.course_id == course_id).all()

@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    a = db.query(models.Assignment).filter(models.Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(a)
    db.commit()
    return {"message": "Deleted"}

@router.get("/submissions/{assignment_id}")
def get_submissions(assignment_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    rows = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.assignment_id == assignment_id
    ).all()
    result = []
    for r in rows:
        student = db.query(models.User).filter(models.User.id == r.user_id).first()
        result.append({
            "id": r.id,
            "student_name": student.name if student else "",
            "student_email": student.email if student else "",
            "file_path": r.file_path,
            "note": r.note,
            "grade": r.grade,
            "feedback": r.feedback,
            "submitted_at": r.submitted_at,
            "graded_at": r.graded_at
        })
    return result

@router.post("/submit")
async def submit_assignment(
    assignment_id: int = Form(...),
    note: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    existing = db.query(models.AssignmentSubmission).filter_by(
        assignment_id=assignment_id, user_id=user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already submitted")
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    sub = models.AssignmentSubmission(
        assignment_id=assignment_id,
        user_id=user.id,
        file_path=f"/uploads/assignments/{filename}",
        note=note
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@router.patch("/grade/{submission_id}")
def grade_submission(submission_id: int, data: GradeIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    sub = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.id == submission_id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Not found")
    sub.grade = data.grade
    sub.feedback = data.feedback
    sub.graded_at = datetime.utcnow()
    db.commit()
    return {"message": "Graded", "grade": sub.grade}

@router.get("/my-submissions")
def my_submissions(db: Session = Depends(get_db), user=Depends(get_current_user)):
    rows = db.query(models.AssignmentSubmission).filter(
        models.AssignmentSubmission.user_id == user.id
    ).all()
    result = []
    for r in rows:
        assignment = db.query(models.Assignment).filter(
            models.Assignment.id == r.assignment_id
        ).first()
        course = db.query(models.Course).filter(
            models.Course.id == assignment.course_id
        ).first() if assignment else None
        result.append({
            "id": r.id,
            "assignment_id": r.assignment_id,
            "assignment_title": assignment.title if assignment else "",
            "course": course.title if course else "",
            "file_path": r.file_path,
            "note": r.note,
            "grade": r.grade,
            "feedback": r.feedback,
            "submitted_at": r.submitted_at,
            "graded_at": r.graded_at
        })
    return result