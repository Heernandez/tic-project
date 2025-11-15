# backend/app/models.py
from datetime import datetime
from enum import Enum
from sqlalchemy.orm import relationship


from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Text,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship

from .db import Base


class ReportStatus(str, Enum):
    NUEVO = "nuevo"
    EN_PROGRESO = "en_progreso"
    REASIGNADO = "reasignado"
    FINALIZADO = "finalizado"


class Report(Base):
    __tablename__ = "reports"

    # ID numérico (consecutivo)
    id = Column(Integer, primary_key=True, index=True)

    # ID hash público (para URLs, nombres de archivo, etc.)
    public_id = Column(String, unique=True, index=True, nullable=False)

    # ID del usuario que creó el reporte (opcional) usando el email.
    citizen_email = Column(String, index=True, nullable=True)

    # Datos geográficos
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Descripción
    description = Column(Text, nullable=False)

    # Estado
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.NUEVO, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones
    media = relationship("ReportMedia", back_populates="report", cascade="all, delete-orphan")
    comments = relationship("ReportComment", back_populates="report", cascade="all, delete-orphan")


class ReportMedia(Base):
    __tablename__ = "report_media"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)

    # Nombre del archivo (ej. HASH_1.jpg) relativo a la carpeta de media
    file_name = Column(String, nullable=False)

    # image / video (por si luego quieres distinguir)
    media_type = Column(String, nullable=False, default="image")

    # consecutivo por si lo quieres usar para orden
    order = Column(Integer, nullable=False, default=1)

    report = relationship("Report", back_populates="media")


class ReportComment(Base):
    __tablename__ = "report_comments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)

    author = Column(String, nullable=True)  # operario, ciudadano, etc.
    content = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    report = relationship("Report", back_populates="comments")
    # 👇 nueva relación
    media = relationship(
        "ReportCommentMedia",
        back_populates="comment",
        cascade="all, delete-orphan",
    )


class ReportCommentMedia(Base):
    __tablename__ = "report_comment_media"

    id = Column(Integer, primary_key=True, index=True)
    comment_id = Column(Integer, ForeignKey("report_comments.id", ondelete="CASCADE"), nullable=False)

    file_name = Column(String, nullable=False)     # p.ej. HASH_c10_1.jpg
    media_type = Column(String, nullable=False, default="image")
    order = Column(Integer, nullable=False, default=1)

    comment = relationship("ReportComment", back_populates="media")

class EmailOTP(Base):
    """
    Tabla para almacenar el código de verificación asociado a un email
    con un TTL de 3 minutos.
    """
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    otp_code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

class SystemUser(Base):
    """
    Usuarios del sistema (operarios / admins).
    Maneja:
      - username
      - password_hash
      - last_login_at (última sesión)
      - session_token (idSesion)
      - session_expires_at (TTL de la sesión)
    """
    __tablename__ = "system_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    last_login_at = Column(DateTime, nullable=True)

    # idSesion
    session_token = Column(String, index=True, nullable=True)
    session_expires_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)