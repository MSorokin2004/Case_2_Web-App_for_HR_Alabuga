from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
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
    in_basket: Optional[bool] = None,
    desired_position: Optional[str] = None,
    status: Optional[str] = None,
    min_salary: Optional[int] = None,
    max_salary: Optional[int] = None,
    work_format: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.hr, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = db.query(models.Resume)
    
    if in_basket is not None:
        query = query.filter(models.Resume.in_basket == in_basket)
    if desired_position:
        query = query.filter(models.Resume.desired_position.ilike(f"%{desired_position}%"))
    if status:
        query = query.filter(models.Resume.status == status)
    if min_salary is not None:
        query = query.filter(models.Resume.salary_expectation >= min_salary)
    if max_salary is not None:
        query = query.filter(models.Resume.salary_expectation <= max_salary)
    if work_format:
        query = query.filter(models.Resume.work_format.ilike(f"%{work_format}%"))
    
    resumes = query.offset(skip).limit(limit).all()
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

@router.post("/{resume_id}/basket")
def toggle_basket(
    resume_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.hr:
        raise HTTPException(status_code=403, detail="Only HR can manage basket")
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume.in_basket = not resume.in_basket
    db.commit()
    return {"in_basket": resume.in_basket}

@router.get("/{resume_id}/detail", response_model=schemas.ResumeDetailOut)
def get_resume_detail(
    resume_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.hr, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    # Примечание: отзывы теперь отдельным эндпоинтом, здесь не подгружаем
    return resume


@router.put("/{resume_id}/status")
def update_resume_status(
    resume_id: int,
    status: str,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.hr, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    allowed_statuses = [
        "В поиске", "На рассмотрении", "Собеседование назначено",
        "Собеседование пройдено", "Оффер", "Принят", "Отказ", "Резерв"
    ]
    if status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    resume.status = status
    db.commit()
    return {"status": resume.status}