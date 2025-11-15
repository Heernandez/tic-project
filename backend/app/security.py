# backend/app/security.py
from datetime import datetime
from uuid import uuid4

from fastapi import Depends, HTTPException, Header, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .db import get_db
from . import models

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Tiempo de vida de la sesión (en minutos)
SESSION_TTL_MINUTES = 60 * 8  # 8 horas


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_session_token() -> str:
    return uuid4().hex


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str = Header(None, alias="Authorization"),
) -> models.SystemUser:
    """
    Lee el header Authorization: Bearer <session_token>
    y devuelve el usuario si la sesión es válida.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta encabezado Authorization",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de Authorization inválido. Use: Bearer <token>",
        )

    user = (
        db.query(models.SystemUser)
        .filter(models.SystemUser.session_token == token)
        .first()
    )

    if not user or not user.session_expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida",
        )

    now = datetime.utcnow()
    if user.session_expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada",
        )

    return user
