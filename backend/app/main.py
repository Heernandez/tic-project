# backend/app/main.py
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from . import models
from .api import reports,auth 

from dotenv import load_dotenv  # 👈 nuevo
# 👇 Cargar variables del archivo .env (busca hacia arriba hasta encontrarlo)
BASE_DIR = Path(__file__).resolve().parents[1]  # backend/
load_dotenv(BASE_DIR / ".env")
# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(title="API Reportes Geográficos")

# CORS (para el frontend en local; luego puedes ajustar dominios)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas
app.include_router(auth.router, prefix="/api")     # 👈 /api/auth/...
app.include_router(reports.router, prefix="/api")

# ---- Servir media de ciudadanos ----
MEDIA_DIR = Path(__file__).resolve().parent / "media"
MEDIA_DIR.mkdir(exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

# ---- Servir media de operarios (evidencias de comentarios) ----
OPERATOR_MEDIA_DIR = Path(__file__).resolve().parent / "media_operator"
OPERATOR_MEDIA_DIR.mkdir(exist_ok=True)
app.mount("/media-operator", StaticFiles(directory=OPERATOR_MEDIA_DIR), name="media_operator")