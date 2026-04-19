from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
from pydantic import BaseModel
from datetime import datetime
import models

router = APIRouter()

def teacher_only(user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    return user

class AttendanceIn(BaseModel):
    student_id: int
    course_id: int
    present: bool = True

class CertificateIn(BaseModel):
    student_id: int
    course_id: int

class ProgressIn(BaseModel):
    student_id: int
    enrollment_id: int
    progress: float

def check_and_issue_certificate(db: Session, user_id: int, course_id: int):
    existing = db.query(models.Certificate).filter_by(
        user_id=user_id, course_id=course_id
    ).first()
    if existing:
        return

    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        return

    all_videos = db.query(models.Video).filter(
        models.Video.course_id == course_id
    ).all()
    watched = db.query(models.VideoWatch).filter_by(
        user_id=user_id, course_id=course_id
    ).all()
    watched_ids = {w.video_id for w in watched}
    all_video_ids = {v.id for v in all_videos}
    videos_done = len(all_videos) == 0 or all_video_ids.issubset(watched_ids)

    quizzes = db.query(models.Quiz).filter(
        models.Quiz.course_id == course_id
    ).all()
    if quizzes:
        passed = False
        for q in quizzes:
            attempt = db.query(models.QuizAttempt).filter_by(
                quiz_id=q.id, user_id=user_id
            ).first()
            if attempt and attempt.total > 0 and (attempt.score / attempt.total) >= 0.5:
                passed = True
                break
        quiz_done = passed
    else:
        quiz_done = True

    assignments = db.query(models.Assignment).filter(
        models.Assignment.course_id == course_id
    ).all()
    if assignments:
        submitted = False
        for a in assignments:
            sub = db.query(models.AssignmentSubmission).filter_by(
                assignment_id=a.id, user_id=user_id
            ).first()
            if sub:
                submitted = True
                break
        assign_done = submitted
    else:
        assign_done = True

    if videos_done and quiz_done and assign_done:
        cert = models.Certificate(
            user_id=user_id,
            course_id=course_id,
            verified=True
        )
        db.add(cert)
        enrollment = db.query(models.Enrollment).filter_by(
            user_id=user_id, course_id=course_id
        ).first()
        if enrollment:
            enrollment.progress = 100.0
        db.commit()

@router.get("/students")
def get_my_students(db: Session = Depends(get_db), user=Depends(teacher_only)):
    if user.role == "developer":
        students = db.query(models.User).filter(models.User.role == "student").all()
    else:
        my_course_ids = [
            c.id for c in db.query(models.Course).filter(
                models.Course.instructor_id == user.id
            ).all()
        ]
        enrolled_user_ids = list(set([
            e.user_id for e in db.query(models.Enrollment).filter(
                models.Enrollment.course_id.in_(my_course_ids)
            ).all()
        ]))
        students = db.query(models.User).filter(
            models.User.id.in_(enrolled_user_ids),
            models.User.role == "student"
        ).all()

    result = []
    for s in students:
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.user_id == s.id
        ).all()
        enroll_details = []
        for e in enrollments:
            course = db.query(models.Course).filter(
                models.Course.id == e.course_id
            ).first()
            enroll_details.append({
                "enrollment_id": e.id,
                "course_id": e.course_id,
                "course_title": course.title if course else "",
                "progress": e.progress
            })
        att = db.query(models.Attendance).filter(
            models.Attendance.user_id == s.id
        ).all()
        att_rate = round(
            sum(1 for a in att if a.present) / len(att) * 100, 1
        ) if att else 0
        certs = db.query(models.Certificate).filter(
            models.Certificate.user_id == s.id
        ).count()
        result.append({
            "id": s.id,
            "name": s.name,
            "email": s.email,
            "enrollments": enroll_details,
            "attendance_rate": att_rate,
            "certificates": certs,
            "created_at": s.created_at
        })
    return result

@router.post("/mark-attendance")
def mark_attendance(data: AttendanceIn, db: Session = Depends(get_db), user=Depends(teacher_only)):
    a = models.Attendance(
        user_id=data.student_id,
        course_id=data.course_id,
        present=data.present,
        marked_by=user.id
    )
    db.add(a)
    db.commit()
    return {"message": "Attendance marked"}

@router.post("/issue-certificate")
def issue_certificate(data: CertificateIn, db: Session = Depends(get_db), user=Depends(teacher_only)):
    existing = db.query(models.Certificate).filter_by(
        user_id=data.student_id, course_id=data.course_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Certificate already issued")
    c = models.Certificate(
        user_id=data.student_id,
        course_id=data.course_id,
        issued_by=user.id
    )
    db.add(c)
    db.commit()
    return {"message": "Certificate issued"}

@router.patch("/update-progress")
def update_progress(data: ProgressIn, db: Session = Depends(get_db), user=Depends(teacher_only)):
    e = db.query(models.Enrollment).filter(
        models.Enrollment.id == data.enrollment_id
    ).first()
    if not e:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    e.progress = round(data.progress, 1)
    db.commit()
    return {"progress": e.progress}