from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.database import get_db
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[schemas.UserOut])
def get_users(
    role: Optional[models.UserRole] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.all()