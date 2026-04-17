from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=schemas.ReviewOut)
def create_review(
    review: schemas.ReviewCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.manager, models.UserRole.hr]:  # разрешим HR тоже оставлять отзывы?
        raise HTTPException(status_code=403, detail="Only managers can create reviews")
    # Проверим существование резюме
    resume = db.query(models.Resume).filter(models.Resume.id == review.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db_review = models.Review(
        resume_id=review.resume_id,
        reviewer_id=user.id,
        overall_score=review.overall_score,
        strengths=review.strengths,
        weaknesses=review.weaknesses,
        comment=review.comment,
        recommendation=review.recommendation
    )
    db.add(db_review)
    db.commit()

    resume = db.query(models.Resume).filter(models.Resume.id == review.resume_id).first()
    
    if resume:
        if review.recommendation == "рекомендую":
            resume.status = "Рекомендован"
        elif review.recommendation == "отказ":
            resume.status = "Отказ"
        elif review.recommendation == "резерв":
            resume.status = "Резерв"
        db.commit()
        
    db.refresh(db_review)
    return db_review

@router.get("/resume/{resume_id}", response_model=List[schemas.ReviewOut])
def get_reviews_for_resume(
    resume_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    # Доступ: HR, manager или сам кандидат
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if user.role not in [models.UserRole.hr, models.UserRole.manager] and resume.candidate_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    reviews = db.query(models.Review).filter(models.Review.resume_id == resume_id).all()
    return reviews