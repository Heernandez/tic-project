# API de Reportes Geográficos (FastAPI + SQLite)

Esta API permite registrar **reportes geográficos** enviados por ciudadanos, adjuntando imágenes/videos, y gestionarlos desde un panel de operarios.  
Incluye un flujo de **verificación por correo electrónico (OTP con TTL de 3 minutos)** usando Gmail.

---

## 🧰 Tecnologías principales

- [FastAPI](https://fastapi.tiangolo.com/) – Framework web rápido basado en Python y type hints.
- [Uvicorn](https://www.uvicorn.org/) – Servidor ASGI para ejecutar la API.
- [SQLite](https://www.sqlite.org/) – Base de datos embebida (archivo `app.db`).
- [SQLAlchemy](https://www.sqlalchemy.org/) – ORM para modelar y consultar la base de datos.
- [python-dotenv](https://pypi.org/project/python-dotenv/) – Carga variables de entorno desde `.env`.
- SMTP Gmail – Envío de correos con **app password**.

---

## 📁 Estructura (backend)

```text
backend/
  app/
    __init__.py
    main.py          # Entrada FastAPI
    db.py            # Conexión a SQLite y SessionLocal
    models.py        # Modelos SQLAlchemy (Report, Media, Comments, EmailOTP, etc.)
    schemas.py       # Esquemas Pydantic (validación/serialización)
    email_utils.py   # Envío de correo con Gmail (OTP)
    api/
      __init__.py
      auth.py        # Endpoint para solicitar código OTP
      reports.py     # Endpoints de reportes, media y comentarios
  requirements.txt
  .env               # (No se versiona, lo creas tú)
