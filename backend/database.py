from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./learnly.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif DATABASE_URL.startswith("postgresql"):
    connect_args = {"sslmode": "require"}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

from sqlalchemy import text

def add_missing_columns():
    try:
        with engine.connect() as conn:
            statements = [
                "ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR",
                "ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General'",
                """CREATE TABLE IF NOT EXISTS wishlists (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    course_id INTEGER REFERENCES courses(id),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS user_profiles (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) UNIQUE,
                    avatar_url VARCHAR,
                    bio TEXT,
                    linkedin VARCHAR,
                    twitter VARCHAR,
                    website VARCHAR,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS course_ratings (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    course_id INTEGER REFERENCES courses(id),
                    rating INTEGER,
                    review TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS discussions (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER REFERENCES courses(id),
                    user_id INTEGER REFERENCES users(id),
                    parent_id INTEGER,
                    message TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS study_streaks (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) UNIQUE,
                    current_streak INTEGER DEFAULT 0,
                    longest_streak INTEGER DEFAULT 0,
                    last_study_date TIMESTAMPTZ,
                    total_days INTEGER DEFAULT 0,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS student_notes (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    course_id INTEGER REFERENCES courses(id),
                    video_id INTEGER,
                    content TEXT,
                    timestamp FLOAT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS coupon_codes (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR UNIQUE,
                    course_id INTEGER,
                    discount_percent FLOAT,
                    max_uses INTEGER DEFAULT 100,
                    used_count INTEGER DEFAULT 0,
                    created_by INTEGER,
                    expires_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS live_classes (
                    id SERIAL PRIMARY KEY,
                    course_id INTEGER REFERENCES courses(id),
                    title VARCHAR,
                    meet_link VARCHAR,
                    scheduled_at TIMESTAMPTZ,
                    duration_mins INTEGER DEFAULT 60,
                    created_by INTEGER,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    title VARCHAR,
                    body TEXT,
                    type VARCHAR DEFAULT 'general',
                    read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
                """CREATE TABLE IF NOT EXISTS ai_tutor_messages (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    role VARCHAR,
                    content TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )""",
            ]
            for stmt in statements:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    print(f"Migration note: {e}")
            conn.commit()
    except Exception as e:
        print(f"Migration error: {e}")

add_missing_columns()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()