from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/resumes", tags=["resumes"])

@router.post("/", response_model=schemas.ResumeOut)
def create_resume(
    resume: schemas.ResumeCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.candidate:
        raise HTTPException(status_code=403, detail="Only candidates can create resumes")
    # Check if resume already exists
    existing = db.query(models.Resume).filter(models.Resume.candidate_id == user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Resume already exists. Update it instead.")
    db_resume = models.Resume(**resume.dict(), candidate_id=user.id)
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume

@router.get("/me", response_model=schemas.ResumeOut)
def get_my_resume(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.candidate:
        raise HTTPException(status_code=403, detail="Only candidates have resumes")
    resume = db.query(models.Resume).filter(models.Resume.candidate_id == user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.put("/me", response_model=schemas.ResumeOut)
def update_my_resume(
    resume_update: schemas.ResumeUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.candidate:
        raise HTTPException(status_code=403)
    resume = db.query(models.Resume).filter(models.Resume.candidate_id == user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    for key, value in resume_update.dict(exclude_unset=True).items():
        setattr(resume, key, value)
    db.commit()
    db.refresh(resume)
    return resume

@router.get("/", response_model=List[schemas.ResumeOut])
def list_resumes(
    skip: int = 0,
    limit: int = 100,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.hr, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    resumes = db.query(models.Resume).offset(skip).limit(limit).all()
    return resumes

@router.get("/{resume_id}", response_model=schemas.ResumeOut)
def get_resume(
    resume_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.hr, models.UserRole.manager]:
        raise HTTPException(status_code=403)
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404)
    return resume