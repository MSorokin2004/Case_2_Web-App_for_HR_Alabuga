from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas, auth
from app.database import get_db
from app.routers.auth import oauth2_scheme

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
    # Проверим, что получатель существует и является кандидатом
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
    if user.role == models.UserRole.candidate:
        # Кандидат видит только свои входящие
        notifs = db.query(models.Notification).filter(
            models.Notification.recipient_id == user.id
        ).order_by(models.Notification.created_at.desc()).all()
    elif user.role == models.UserRole.hr:
        # HR видит отправленные им уведомления
        notifs = db.query(models.Notification).filter(
            models.Notification.sender_id == user.id
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
    if user.role == models.UserRole.candidate and notif.recipient_id != user.id:
        raise HTTPException(status_code=403)
    notif.is_read = True
    db.commit()
    return {"status": "ok"}