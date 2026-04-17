from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.routers.auth import oauth2_scheme
from pydantic import BaseModel

class OfferRequest(BaseModel):
    resume_id: int
    message: str = "Вам направлен оффер. Пожалуйста, свяжитесь с HR для обсуждения деталей."

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/", response_model=schemas.NotificationOut)
def create_notification(
    notif: schemas.NotificationCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.hr:
        raise HTTPException(status_code=403, detail="Only HR can send notifications")
    recipient = db.query(models.User).filter(models.User.id == notif.recipient_id).first()
    if not recipient or recipient.role != models.UserRole.candidate:
        raise HTTPException(status_code=400, detail="Recipient must be a candidate")
    db_notif = models.Notification(
        sender_id=user.id,
        recipient_id=notif.recipient_id,
        title=notif.title,
        message=notif.message
    )
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

@router.get("/", response_model=List[schemas.NotificationOut])
def get_my_notifications(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    role_value = user.role.value

    if role_value == "candidate":
        notifs = db.query(models.Notification).filter(
            models.Notification.recipient_id == user.id
        ).order_by(models.Notification.created_at.desc()).all()
    elif role_value == "hr":
        # HR теперь видит входящие уведомления (адресованные ему)
        notifs = db.query(models.Notification).filter(
            models.Notification.recipient_id == user.id
        ).order_by(models.Notification.created_at.desc()).all()
    elif role_value == "manager":
        notifs = db.query(models.Notification).filter(
            models.Notification.recipient_id == user.id
        ).order_by(models.Notification.created_at.desc()).all()
    else:
        notifs = []
    return notifs

@router.post("/{notif_id}/read")
def mark_as_read(
    notif_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    # Только получатель может отметить прочитанным
    if notif.recipient_id != user.id:
        raise HTTPException(status_code=403, detail="Not your notification")
    notif.is_read = True
    db.commit()
    return {"status": "ok"}

@router.get("/unread-count")
def get_unread_count(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    count = db.query(models.Notification).filter(
        models.Notification.recipient_id == user.id,
        models.Notification.is_read == False
    ).count()
    return {"count": count}

@router.post("/offer")
def send_offer(
    data: OfferRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.hr, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    resume = db.query(models.Resume).filter(models.Resume.id == data.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    candidate = db.query(models.User).filter(models.User.id == resume.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Создаём уведомление
    notif = models.Notification(
        sender_id=user.id,
        recipient_id=candidate.id,
        title="Оффер",
        message=data.message
    )
    db.add(notif)
    
    # Меняем статус резюме
    resume.status = "Оффер"
    db.commit()
    db.refresh(notif)
    return {"status": "success", "notification_id": notif.id}