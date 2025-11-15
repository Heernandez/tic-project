# backend/app/api/auth.py
import random
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models, schemas
from ..email_utils import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-code")
def request_code(payload: schemas.RequestCodeInput, db: Session = Depends(get_db)):
    """
    Recibe un email, genera un OTP de 6 dígitos y lo guarda con TTL de 3 minutos.
    Si el email ya existe, se actualiza el código y el TTL.
    Luego envía el código por correo usando Gmail.
    """
    email = payload.email.strip().lower()
    otp_code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.utcnow() + timedelta(minutes=3)

    # Buscar si ya existe registro para ese email
    db_otp = db.query(models.EmailOTP).filter(models.EmailOTP.email == email).first()
    if db_otp:
        db_otp.otp_code = otp_code
        db_otp.expires_at = expires_at
        db_otp.updated_at = datetime.utcnow()
    else:
        db_otp = models.EmailOTP(
            email=email,
            otp_code=otp_code,
            expires_at=expires_at,
        )
        db.add(db_otp)

    db.commit()

    # Enviar correo
    try:
        send_otp_email(email, otp_code)
    except Exception as e:
        # Aquí podrías hacer logging del error real
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo enviar el correo de verificación",
        )

    return {"detail": "Código de verificación enviado"}
