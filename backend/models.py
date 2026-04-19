from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="student")
    referral_code = Column(String, unique=True, nullable=True)
    referred_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    enrollments = relationship("Enrollment", back_populates="user", foreign_keys="Enrollment.user_id")
    attendance = relationship("Attendance", back_populates="user", foreign_keys="Attendance.user_id")
    assessments = relationship("Assessment", back_populates="user")
    certificates = relationship("Certificate", back_populates="user", foreign_keys="Certificate.user_id")
    submissions = relationship("AssignmentSubmission", back_populates="user")
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    video_watches = relationship("VideoWatch", back_populates="user")
    teacher_profile = relationship("TeacherProfile", back_populates="user", uselist=False, foreign_keys="TeacherProfile.user_id")

class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    phone = Column(String, nullable=True)
    whatsapp = Column(String, nullable=True)
    office_hours = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    bank_account_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    upi_id = Column(String, nullable=True)
    payout_pending = Column(Float, default=0.0)
    payout_total = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="teacher_profile", foreign_keys=[user_id])

class PlatformSettings(Base):
    __tablename__ = "platform_settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    instructor = Column(String)
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_modules = Column(Integer, default=0)
    is_paid = Column(Boolean, default=False)
    price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    enrollments = relationship("Enrollment", back_populates="course")
    attendance = relationship("Attendance", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")
    certificates = relationship("Certificate", back_populates="course")
    videos = relationship("Video", back_populates="course")
    assignments = relationship("Assignment", back_populates="course")
    quizzes = relationship("Quiz", back_populates="course")
    announcements = relationship("Announcement", back_populates="course")
    payments = relationship("Payment", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    progress = Column(Float, default=0.0)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="enrollments", foreign_keys=[user_id])
    course = relationship("Course", back_populates="enrollments")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    date = Column(DateTime, default=datetime.utcnow)
    present = Column(Boolean, default=True)
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="attendance", foreign_keys=[user_id])
    course = relationship("Course", back_populates="attendance")

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String)
    score = Column(Float)
    max_score = Column(Float, default=100.0)
    taken_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="assessments")
    course = relationship("Course", back_populates="assessments")

class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    issued_at = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=True)
    issued_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="certificates", foreign_keys=[user_id])
    course = relationship("Course", back_populates="certificates")

class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    youtube_url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    course = relationship("Course", back_populates="videos")
    watches = relationship("VideoWatch", back_populates="video")

class VideoWatch(Base):
    __tablename__ = "video_watches"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    watched_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="video_watches")
    video = relationship("Video", back_populates="watches")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    google_form_url = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    graded_at = Column(DateTime, nullable=True)
    assignment = relationship("Assignment", back_populates="submissions")
    user = relationship("User", back_populates="submissions")

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    google_form_url = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    course = relationship("Course", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct = Column(String, nullable=False)
    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float, default=0.0)
    total = Column(Integer, default=0)
    answers = Column(Text, nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")

class Referral(Base):
    __tablename__ = "referrals"
    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"))
    referred_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    title = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    course = relationship("Course", back_populates="announcements")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    amount = Column(Float, nullable=False)
    platform_fee = Column(Float, default=5.0)
    teacher_amount = Column(Float, default=0.0)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    status = Column(String, default="created")
    teacher_paid = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="payments")
    course = relationship("Course", back_populates="payments")