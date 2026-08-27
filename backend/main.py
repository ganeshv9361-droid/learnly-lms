from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine
import models, os
from dotenv import load_dotenv
from routes import (
    users, courses, enrollments, attendance, assessments,
    certificates, videos, assignments, quizzes,
    referrals, teacher, announcements, payments,
    video_watch, developer, teacher_profile, ai_tutor,
    notifications, ratings, discussions, streaks,
    notes, coupons, live_classes, leaderboard, verify
)

load_dotenv()
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Learnly LMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/assignments", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(users.router,           prefix="/api/users",           tags=["users"])
app.include_router(courses.router,         prefix="/api/courses",         tags=["courses"])
app.include_router(enrollments.router,     prefix="/api/enrollments",     tags=["enrollments"])
app.include_router(attendance.router,      prefix="/api/attendance",      tags=["attendance"])
app.include_router(assessments.router,     prefix="/api/assessments",     tags=["assessments"])
app.include_router(certificates.router,    prefix="/api/certificates",    tags=["certificates"])
app.include_router(videos.router,          prefix="/api/videos",          tags=["videos"])
app.include_router(assignments.router,     prefix="/api/assignments",     tags=["assignments"])
app.include_router(quizzes.router,         prefix="/api/quizzes",         tags=["quizzes"])
app.include_router(referrals.router,       prefix="/api/referrals",       tags=["referrals"])
app.include_router(teacher.router,         prefix="/api/teacher",         tags=["teacher"])
app.include_router(announcements.router,   prefix="/api/announcements",   tags=["announcements"])
app.include_router(payments.router,        prefix="/api/payments",        tags=["payments"])
app.include_router(video_watch.router,     prefix="/api/watch",           tags=["watch"])
app.include_router(developer.router,       prefix="/api/developer",       tags=["developer"])
app.include_router(teacher_profile.router, prefix="/api/teacher-profile", tags=["teacher-profile"])
app.include_router(ai_tutor.router,        prefix="/api/ai-tutor",        tags=["ai-tutor"])
app.include_router(notifications.router,   prefix="/api/notifications",   tags=["notifications"])
app.include_router(ratings.router,         prefix="/api/ratings",         tags=["ratings"])
app.include_router(discussions.router,     prefix="/api/discussions",     tags=["discussions"])
app.include_router(streaks.router,         prefix="/api/streaks",         tags=["streaks"])
app.include_router(notes.router,           prefix="/api/notes",           tags=["notes"])
app.include_router(coupons.router,         prefix="/api/coupons",         tags=["coupons"])
app.include_router(live_classes.router,    prefix="/api/live-classes",    tags=["live-classes"])
app.include_router(leaderboard.router,     prefix="/api/leaderboard",     tags=["leaderboard"])
app.include_router(verify.router,          prefix="/api/verify-cert",     tags=["verify"])

@app.get("/")
def root():
    return {"message": "Learnly API running"}