from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, auth
from app.database import get_db
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/interviews", tags=["interviews"])

def create_notification(db: Session, sender_id: int, recipient_id: int, title: str, message: str, interview_id: int = None):
    notif = models.Notification(
        sender_id=sender_id,
        recipient_id=recipient_id,
        title=title,
        message=message,
        interview_id=interview_id
    )
    db.add(notif)
    db.commit()

@router.post("/{interview_id}/respond")
def respond_to_interview(
    interview_id: int,
    response: str,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.candidate:
        raise HTTPException(status_code=403, detail="Only candidates can respond")
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.candidate_id != user.id:
        raise HTTPException(status_code=403, detail="Not your interview")
    if interview.status != "scheduled":
        raise HTTPException(status_code=400, detail="Interview already responded or cancelled")

    details = f"Дата: {interview.datetime}, Формат: {interview.format}"
    if interview.location_or_link:
        details += f", Место/Ссылка: {interview.location_or_link}"

    if response == "accept":
        interview.status = "accepted"
        title = "Кандидат принял приглашение"
        message = f"Кандидат {user.full_name} принял приглашение на собеседование. {details}"
    elif response == "decline":
        interview.status = "declined"
        title = "Кандидат отклонил приглашение"
        message = f"Кандидат {user.full_name} отклонил приглашение на собеседование. {details}"
    else:
        raise HTTPException(status_code=400, detail="Invalid response")

    db.commit()

    hr = db.query(models.User).filter(models.User.id == interview.hr_id).first()
    if hr:
        create_notification(db, user.id, hr.id, title, message, interview_id)
    manager = db.query(models.User).filter(models.User.id == interview.manager_id).first()
    if manager:
        create_notification(db, user.id, manager.id, title, message, interview_id)

    return {"status": interview.status}


@router.post("/", response_model=schemas.InterviewOut)
def create_interview(
    interview: schemas.InterviewCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.hr:
        raise HTTPException(status_code=403, detail="Only HR can schedule interviews")
    candidate = db.query(models.User).filter(models.User.id == interview.candidate_id).first()
    manager = db.query(models.User).filter(models.User.id == interview.manager_id).first()
    if not candidate or not manager:
        raise HTTPException(status_code=400, detail="Invalid candidate or manager")
    db_interview = models.Interview(
        candidate_id=interview.candidate_id,
        hr_id=user.id,
        manager_id=interview.manager_id,
        resume_id=interview.resume_id,
        datetime=interview.datetime,
        format=interview.format,
        location_or_link=interview.location_or_link,
        comment=interview.comment,
        status="scheduled"
    )
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)

    create_notification(
        db, user.id, candidate.id,
        "Приглашение на собеседование",
        f"Вас пригласили на собеседование {interview.datetime}. Формат: {interview.format}. Комментарий: {interview.comment or ''}",
        db_interview.id
    )
    create_notification(
        db, user.id, manager.id,
        "Назначено собеседование",
        f"Вы назначены собеседующим для кандидата {candidate.full_name} на {interview.datetime}",
        db_interview.id
    )
    return db_interview


@router.post("/{interview_id}/cancel")
def cancel_interview(
    interview_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role not in [models.UserRole.hr, models.UserRole.manager]:
        raise HTTPException(status_code=403, detail="Only HR or manager can cancel")
    interview = db.query(models.Interview).filter(models.Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    if user.role == models.UserRole.hr and interview.hr_id != user.id:
        raise HTTPException(status_code=403, detail="You are not the HR who created this interview")
    if user.role == models.UserRole.manager and interview.manager_id != user.id:
        raise HTTPException(status_code=403, detail="You are not assigned to this interview")
    if interview.status in ["cancelled", "declined"]:
        raise HTTPException(status_code=400, detail="Interview already cancelled or declined")

    interview.status = "cancelled"
    db.commit()

    candidate = db.query(models.User).filter(models.User.id == interview.candidate_id).first()
    if candidate:
        create_notification(
            db, user.id, candidate.id,
            "Собеседование отменено",
            f"Собеседование, назначенное на {interview.datetime}, было отменено.",
            interview_id
        )
    if user.role == models.UserRole.hr:
        manager = db.query(models.User).filter(models.User.id == interview.manager_id).first()
        if manager:
            create_notification(db, user.id, manager.id, "Собеседование отменено", "HR отменил собеседование.", interview_id)
    else:
        hr = db.query(models.User).filter(models.User.id == interview.hr_id).first()
        if hr:
            create_notification(db, user.id, hr.id, "Собеседование отменено", "Руководитель отменил собеседование.", interview_id)
    return {"status": "cancelled"}

@router.get("/", response_model=list[schemas.InterviewOut])


def list_interviews(
    resume_id: int = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    query = db.query(models.Interview)
    if resume_id:
        query = query.filter(models.Interview.resume_id == resume_id)
    interviews = query.all()
    return interviews

@router.post("/request")
def request_interview(
    request: schemas.InterviewRequest,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    if user.role != models.UserRole.manager:
        raise HTTPException(status_code=403, detail="Only managers can request interviews")
    # Найти кандидата по resume_id
    resume = db.query(models.Resume).filter(models.Resume.id == request.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    candidate = db.query(models.User).filter(models.User.id == resume.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    # Найти всех HR (или конкретного HR, к которому относится резюме – упростим: всех HR)
    hrs = db.query(models.User).filter(models.User.role == models.UserRole.hr).all()
    if not hrs:
        raise HTTPException(status_code=400, detail="No HR users found")
    # Отправить уведомление каждому HR (или первому? лучше всем, кто может обработать)
    title = f"Запрос на собеседование от руководителя {user.full_name}"
    message = f"Руководитель {user.full_name} запросил собеседование с кандидатом {candidate.full_name} (резюме ID {resume.id}). Комментарий: {request.comment or 'нет'}"
    for hr in hrs:
        create_notification(db, user.id, hr.id, title, message, None)
    return {"status": "request sent"}