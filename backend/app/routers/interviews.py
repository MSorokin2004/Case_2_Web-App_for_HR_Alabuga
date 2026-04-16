from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/interviews", tags=["interviews"])

@router.post("/", response_model=schemas.InterviewOut)
def create_interview(
    interview: schemas.InterviewCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.hr:
        raise HTTPException(status_code=403, detail="Only HR can schedule interviews")
    # Validate candidate, manager, resume exist
    # In real app add checks
    db_interview = models.Interview(
        candidate_id=interview.candidate_id,
        hr_id=user.id,
        manager_id=interview.manager_id,
        resume_id=interview.resume_id,
        datetime=interview.datetime,
        format=interview.format,
        location_or_link=interview.location_or_link,
        comment=interview.comment
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview

@router.post("/{interview_id}/review", response_model=schemas.ReviewOut)
def add_review(
    interview_id: int,
    review: schemas.ReviewCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.manager:
        raise HTTPException(status_code=403, detail="Only managers can review")
    # Check if interview exists and user is manager of it
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.manager_id != user.id:
        raise HTTPException(status_code=403, detail="You are not assigned to this interview")
    db_review = models.Review(
        interview_id=interview_id,
        reviewer_id=user.id,
        overall_score=review.overall_score,
        strengths=review.strengths,
        weaknesses=review.weaknesses,
        comment=review.comment,
        recommendation=review.recommendation
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review