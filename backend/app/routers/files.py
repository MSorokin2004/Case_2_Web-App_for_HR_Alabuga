from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import shutil
from app import models, schemas, auth
from app.database import get_db
from app.config import settings
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = settings.upload_dir
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload/{resume_id}")
async def upload_file(
    resume_id: int,
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    # Check if user is owner of resume or HR
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if user.role != models.UserRole.hr and resume.candidate_id != user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    # Save file
    file_location = os.path.join(UPLOAD_DIR, f"{resume_id}_{file.filename}")
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Record in DB
    db_file = models.Document(
        resume_id=resume_id,
        filename=file.filename,
        file_path=file_location,
        file_type=file.content_type
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return {"filename": file.filename, "id": db_file.id}

@router.get("/download/{document_id}")
async def download_file(
    document_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    user = auth.get_current_user(db, token)
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    # Check access rights
    resume = db.query(models.Resume).filter(models.Resume.id == document.resume_id).first()
    if user.role != models.UserRole.hr and resume.candidate_id != user.id:
        raise HTTPException(status_code=403)
    return FileResponse(document.file_path, media_type='application/octet-stream', filename=document.filename)