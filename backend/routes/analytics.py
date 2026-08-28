from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

@router.get("/course/{course_id}")
def course_analytics(course_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role not in ["teacher", "developer"]:
        raise HTTPException(status_code=403, detail="Teachers only")
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    videos = db.query(models.Video).filter_by(course_id=course_id).all()
    enrollments = db.query(models.Enrollment).filter_by(course_id=course_id).all()
    total_students = len(enrollments)
    video_stats = []
    for v in videos:
        watches = db.query(models.VideoWatch).filter_by(video_id=v.id).count()
        completion_rate = round(watches / total_students * 100, 1) if total_students > 0 else 0
        video_stats.append({
            "video_id": v.id,
            "title": v.title,
            "total_watches": watches,
            "completion_rate": completion_rate
        })
    assignments = db.query(models.Assignment).filter_by(course_id=course_id).all()
    assignment_stats = []
    for a in assignments:
        submissions = db.query(models.AssignmentSubmission).filter_by(assignment_id=a.id).count()
        graded = db.query(models.AssignmentSubmission).filter(
            models.AssignmentSubmission.assignment_id == a.id,
            models.AssignmentSubmission.grade != None
        ).count()
        assignment_stats.append({
            "assignment_id": a.id,
            "title": a.title,
            "submissions": submissions,
            "graded": graded,
            "submission_rate": round(submissions / total_students * 100, 1) if total_students > 0 else 0
        })
    quizzes = db.query(models.Quiz).filter_by(course_id=course_id).all()
    quiz_stats = []
    for q in quizzes:
        attempts = db.query(models.QuizAttempt).filter_by(quiz_id=q.id).all()
        avg_score = round(sum(a.score/a.total*100 for a in attempts if a.total > 0)/len(attempts), 1) if attempts else 0
        passed = sum(1 for a in attempts if a.total > 0 and a.score/a.total >= 0.5)
        quiz_stats.append({
            "quiz_id": q.id,
            "title": q.title,
            "attempts": len(attempts),
            "avg_score": avg_score,
            "pass_rate": round(passed/len(attempts)*100, 1) if attempts else 0
        })
    avg_progress = round(sum(e.progress for e in enrollments)/total_students, 1) if total_students > 0 else 0
    ratings = db.query(models.CourseRating).filter_by(course_id=course_id).all()
    avg_rating = round(sum(r.rating for r in ratings)/len(ratings), 1) if ratings else 0
    return {
        "total_students": total_students,
        "avg_progress": avg_progress,
        "avg_rating": avg_rating,
        "total_ratings": len(ratings),
        "video_stats": video_stats,
        "assignment_stats": assignment_stats,
        "quiz_stats": quiz_stats
    }
