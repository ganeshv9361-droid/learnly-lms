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
            conn.execute(text("ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR"))
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'General'"))
            conn.commit()
    except Exception as e:
        print(f"Column migration note: {e}")

add_missing_columns()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()