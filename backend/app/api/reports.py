# backend/app/api/reports.py
import os
from pathlib import Path
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    status,
)
from sqlalchemy.orm import Session
from shutil import copyfileobj

from ..db import get_db
from .. import models, schemas

router = APIRouter(prefix="/reports", tags=["reports"])

# Carpeta donde se guardan imágenes/videos
BASE_DIR = Path(__file__).resolve().parents[1]  # backend/app
MEDIA_DIR = BASE_DIR / "media"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
# 👇 carpeta para evidencias de operarios
OPERATOR_MEDIA_DIR = BASE_DIR / "media_operator"
OPERATOR_MEDIA_DIR.mkdir(parents=True, exist_ok=True)

def validate_email_otp(db: Session, email: str, otp_code: str) -> None:
    """
    Valida que exista un OTP para el email, que no esté vencido y que el código coincida.
    """
    email_normalized = email.strip().lower()
    otp = db.query(models.EmailOTP).filter(models.EmailOTP.email == email_normalized).first()

    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No existe un código de verificación para este correo. Solicítalo nuevamente.",
        )

    now = datetime.utcnow()
    if otp.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de verificación ha expirado. Solicita uno nuevo.",
        )

    if otp.otp_code != otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El código de verificación es incorrecto.",
        )

    # Si quisieras que el código sea de un solo uso, podrías borrarlo aquí:
    db.delete(otp)
    db.commit()

@router.post(
    "/",
    response_model=schemas.ReportOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(...),

    # 👇 nuevos campos
    email: str = Form(...),
    otp_code: str = Form(...),

    files: Optional[List[UploadFile]] = File(default=None),
    db: Session = Depends(get_db),
):
    """
    Crea un nuevo reporte validando previamente el email + código OTP.
    """
    email_normalized = email.strip().lower()

    # 1. Validar OTP
    validate_email_otp(db, email_normalized, otp_code)

    # 2. Generar hash público para el reporte
    public_id = uuid4().hex

    # 3. Crear el reporte base (incluyendo email)
    report = models.Report(
        public_id=public_id,
        citizen_email=email_normalized,
        latitude=latitude,
        longitude=longitude,
        description=description,
        status=models.ReportStatus.NUEVO,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # 4. Guardar archivos (igual que antes)
    saved_media = []
    if files:
        for idx, upload in enumerate(files, start=1):
            _, ext = os.path.splitext(upload.filename or "")
            ext = ext or ""
            file_name = f"{public_id}_{idx}{ext}"
            dest_path = MEDIA_DIR / file_name

            with dest_path.open("wb") as buffer:
                copyfileobj(upload.file, buffer)

            media_type = "image"
            if upload.content_type and upload.content_type.startswith("video/"):
                media_type = "video"

            media = models.ReportMedia(
                report_id=report.id,
                file_name=file_name,
                media_type=media_type,
                order=idx,
            )
            db.add(media)
            saved_media.append(media)

        db.commit()
        db.refresh(report)

    return report



@router.get("/{public_id}", response_model=schemas.ReportOut)
def get_report(public_id: str, db: Session = Depends(get_db)):
    """
    Obtiene un reporte por su public_id (hash) con media y comentarios.
    """
    report = (
        db.query(models.Report)
        .filter(models.Report.public_id == public_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    return report

@router.post(
    "/{public_id}/comments",
    response_model=schemas.ReportCommentOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    public_id: str,
    content: str = Form(...),
    author: Optional[str] = Form(None),
    evidences: Optional[List[UploadFile]] = File(default=None),
    db: Session = Depends(get_db),
):
    """
    Agrega un comentario a un reporte.

    Además, opcionalmente permite adjuntar archivos como evidencias
    (subidos por el operario), que se guardan en una carpeta separada.
    """
    report = (
        db.query(models.Report)
        .filter(models.Report.public_id == public_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # 1. Crear comentario
    comment = models.ReportComment(
        report_id=report.id,
        author=author,
        content=content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # 2. Guardar evidencias si vienen
    if evidences:
        for idx, upload in enumerate(evidences, start=1):
            _, ext = os.path.splitext(upload.filename or "")
            ext = ext or ""

            # Nombre de archivo indicando que es evidencia de comentario:
            # p.ej. HASH_c10_1.jpg (reporte HASH, comment id 10, evid. #1)
            file_name = f"{report.public_id}_c{comment.id}_{idx}{ext}"
            dest_path = OPERATOR_MEDIA_DIR / file_name

            with dest_path.open("wb") as buffer:
                copyfileobj(upload.file, buffer)

            media_type = "image"
            if upload.content_type and upload.content_type.startswith("video/"):
                media_type = "video"

            comment_media = models.ReportCommentMedia(
                comment_id=comment.id,
                file_name=file_name,
                media_type=media_type,
                order=idx,
            )
            db.add(comment_media)

        # actualizar updated_at del reporte
        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(comment)

    return comment


@router.get("/", response_model=List[schemas.ReportOut])
def list_reports(
    status_filter: Optional[models.ReportStatus] = None,
    db: Session = Depends(get_db),
):
    """
    Lista reportes, opcionalmente filtrando por estado.
    """
    query = db.query(models.Report)
    if status_filter:
        query = query.filter(models.Report.status == status_filter)

    # Si luego hay muchos, aquí puedes paginar
    return query.order_by(models.Report.created_at.desc()).all()


# ...

@router.patch("/{public_id}/status", response_model=schemas.ReportOut)
def update_report_status(
    public_id: str,
    status_in: schemas.ReportStatusUpdate,
    db: Session = Depends(get_db),
):
    report = (
        db.query(models.Report)
        .filter(models.Report.public_id == public_id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    report.status = status_in.status
    report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)
    return report
