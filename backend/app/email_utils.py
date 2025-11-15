# backend/app/email_utils.py
import os
import smtplib
import ssl
from email.message import EmailMessage


def send_otp_email(to_email: str, otp_code: str) -> None:
    """
    Envía un correo con el código OTP usando Gmail y app password.
    Requiere variables de entorno:
      - GMAIL_USER
      - GMAIL_APP_PASSWORD
    """
    smtp_user = os.getenv("GMAIL_USER")
    smtp_pass = os.getenv("GMAIL_APP_PASSWORD")

    if not smtp_user or not smtp_pass:
        raise RuntimeError("Faltan GMAIL_USER o GMAIL_APP_PASSWORD en las variables de entorno")

    msg = EmailMessage()
    msg["Subject"] = "Código de verificación para tu reporte"
    msg["From"] = smtp_user
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
