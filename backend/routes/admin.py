from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from auth import get_current_user
import models

router = APIRouter()
@router.get("/admin/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    users = db.query(models.User).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
        for user in users
    ]