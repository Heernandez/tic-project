# backend/app/email_utils.py
import os
import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage
from typing import Optional

from . import models


def _get_sender_address(default_user: str) -> str:
    """
    Permite forzar un remitente específico (p. ej. reportes@ciudadanos.com)
    usando la variable opcional GMAIL_SENDER. Si no se define, se usa el mismo
    usuario con el que autenticamos el SMTP.
    """
    return os.getenv("GMAIL_SENDER") or default_user


def send_otp_email(to_email: str, otp_code: str) -> None:
    smtp_user = os.getenv("GMAIL_USER")
    smtp_pass = os.getenv("GMAIL_APP_PASSWORD")

    if not smtp_user or not smtp_pass:
        raise RuntimeError("Faltan GMAIL_USER o GMAIL_APP_PASSWORD en las variables de entorno")

    msg = EmailMessage()
    msg["Subject"] = "Código de verificación para tu reporte"
    msg["From"] = _get_sender_address(smtp_user)
    msg["To"] = to_email

    msg.set_content(
        f"Tu código de verificación es: {otp_code}\n\n"
        "Este código es válido por 3 minutos. "
        "Utilízalo en la aplicación para confirmar tu reporte."
    )

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)


def send_status_change_email(
    report: models.Report,
    old_status: str,
    new_status: str,
    to_email: Optional[str] = None,
) -> None:
    if not to_email:
        return
    smtp_user = os.getenv("GMAIL_USER")
    smtp_pass = os.getenv("GMAIL_APP_PASSWORD")
    if not smtp_user or not smtp_pass:
        raise RuntimeError("Faltan GMAIL_USER o GMAIL_APP_PASSWORD en las variables de entorno")

    msg = EmailMessage()
    msg["Subject"] = f"Actualización del reporte #{report.id}"
    msg["From"] = _get_sender_address(smtp_user)
    msg["To"] = to_email

    msg.set_content(
        "Hola,\n\n"
        f"Tu reporte {report.public_id} cambió de '{old_status}' a '{new_status}'.\n"
        f"Descripción: {report.description}\n"
        f"Fecha: {datetime.utcnow():%Y-%m-%d %H:%M UTC}\n\n"
        "Puedes consultar el detalle en la plataforma para ver comentarios y evidencias agregadas.\n\n"
        "— Equipo de Reportes Ciudadanos"
    )

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)


def send_comment_notification_email(
    report: models.Report,
    comment: models.ReportComment,
    to_email: Optional[str] = None,
) -> None:
    if not to_email:
        return
    smtp_user = os.getenv("GMAIL_USER")
    smtp_pass = os.getenv("GMAIL_APP_PASSWORD")
    if not smtp_user or not smtp_pass:
        raise RuntimeError("Faltan GMAIL_USER o GMAIL_APP_PASSWORD en las variables de entorno")

    msg = EmailMessage()
    msg["Subject"] = f"Nuevo comentario en tu reporte #{report.id}"
    msg["From"] = _get_sender_address(smtp_user)
    msg["To"] = to_email

    msg.set_content(
        "Hola,\n\n"
        f"Se agregó un nuevo comentario a tu reporte {report.public_id}.\n"
        f"Autor: {comment.author or 'Operario'}\n"
        f"Contenido: {comment.content}\n"
        f"Fecha: {comment.created_at:%Y-%m-%d %H:%M UTC}\n\n"
        "Ingresa a la plataforma para revisar los detalles, evidencias y cambios de estado.\n\n"
        "— Equipo de Reportes Ciudadanos"
    )

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
