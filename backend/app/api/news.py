import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy.orm import Session
from shutil import copyfileobj

from ..db import get_db
from .. import models, schemas
from ..security import get_current_user

router = APIRouter(prefix="/news", tags=["news"])

BASE_DIR = Path(__file__).resolve().parents[1]
MEDIA_NEWS_DIR = BASE_DIR / "media-news"
MEDIA_NEWS_DIR.mkdir(parents=True, exist_ok=True)


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las fechas deben estar en formato ISO 8601 (YYYY-MM-DD HH:MM:SS).",
        )


def _news_is_active(item: models.News, now: datetime) -> bool:
    if item.start_date and now < item.start_date:
        return False
    if item.end_date and now > item.end_date:
        return False
    return True


def _normalize_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def _ensure_content(description: Optional[str], has_media: bool) -> None:
    if not description and not has_media:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La noticia debe contener al menos una descripción o un archivo multimedia.",
        )


@router.post(
    "/",
    response_model=schemas.NewsOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_news(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(default=None),
    db: Session = Depends(get_db),
    current_user: models.SystemUser = Depends(get_current_user),
):
    """
    Crea una noticia/blog con información opcional de temporalidad e imágenes/videos.
    """
    title_clean = title.strip()
    if not title_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El título es obligatorio.",
        )

    description_clean = _normalize_optional_text(description)
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    if start_dt and end_dt and end_dt < start_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de fin debe ser mayor o igual a la fecha de inicio.",
        )

    _ensure_content(description_clean, bool(files))

    news = models.News(
        title=title_clean,
        description=description_clean,
        start_date=start_dt,
        end_date=end_dt,
    )
    db.add(news)
    db.commit()
    db.refresh(news)

    if files:
        existing_order = 0
        for idx, upload in enumerate(files, start=1):
            _, ext = os.path.splitext(upload.filename or "")
            ext = ext or ""
            unique_id = uuid4().hex
            file_name = f"news_{news.id}_{unique_id}_{idx}{ext}"
            dest_path = MEDIA_NEWS_DIR / file_name

            with dest_path.open("wb") as buffer:
                copyfileobj(upload.file, buffer)

            media_type = "image"
            if upload.content_type and upload.content_type.startswith("video/"):
                media_type = "video"

            news_media = models.NewsMedia(
                news_id=news.id,
                file_name=file_name,
                media_type=media_type,
                order=existing_order + idx,
            )
            news.media.append(news_media)

        news.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(news)

    return news


@router.get("/", response_model=List[schemas.NewsOut])
def list_news(
    only_active: bool = Query(True, description="Si es True solo retorna noticias vigentes."),
    db: Session = Depends(get_db),
):
    """
    Lista las noticias ordenadas de la más reciente a la más antigua.
    Si `only_active` es verdadero, solo retorna aquellas cuya temporalidad aplica a la fecha actual.
    """
    news_items = (
        db.query(models.News)
        .order_by(models.News.created_at.desc())
        .all()
    )

    if not only_active:
        return news_items

    now = datetime.utcnow()
    return [item for item in news_items if _news_is_active(item, now)]


@router.get("/{news_id}", response_model=schemas.NewsOut)
def get_news(
    news_id: int,
    db: Session = Depends(get_db),
    only_active: bool = Query(True, description="Restringe el acceso a noticias dentro de la temporalidad"),
):
    """
    Obtiene una noticia por id, opcionalmente validando su temporalidad.
    """
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Noticia no encontrada")

    if only_active and not _news_is_active(news, datetime.utcnow()):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Noticia no disponible")

    return news


@router.put("/{news_id}", response_model=schemas.NewsOut)
async def update_news(
    news_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(default=None),
    db: Session = Depends(get_db),
    current_user: models.SystemUser = Depends(get_current_user),
):
    """
    Actualiza una noticia existente. Permite agregar nuevos archivos y ajustar la temporalidad.
    """
    news = db.query(models.News).filter(models.News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Noticia no encontrada")

    title_clean = title.strip()
    if not title_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El título es obligatorio.",
        )

    description_clean = _normalize_optional_text(description)
    start_dt = _parse_datetime(start_date)
    end_dt = _parse_datetime(end_date)

    if start_dt and end_dt and end_dt < start_dt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de fin debe ser mayor o igual a la fecha de inicio.",
        )

    news.title = title_clean
    news.description = description_clean if description is not None else news.description
    news.start_date = start_dt
    news.end_date = end_dt

    existing_order = max((media.order for media in news.media), default=0)
    if files:
        for idx, upload in enumerate(files, start=1):
            _, ext = os.path.splitext(upload.filename or "")
            ext = ext or ""
            unique_id = uuid4().hex
            file_name = f"news_{news.id}_{unique_id}_{existing_order + idx}{ext}"
            dest_path = MEDIA_NEWS_DIR / file_name

            with dest_path.open("wb") as buffer:
                copyfileobj(upload.file, buffer)

            media_type = "image"
            if upload.content_type and upload.content_type.startswith("video/"):
                media_type = "video"

            news_media = models.NewsMedia(
                news_id=news.id,
                file_name=file_name,
                media_type=media_type,
                order=existing_order + idx,
            )
            news.media.append(news_media)

    _ensure_content(news.description, bool(news.media))

    news.updated_at = datetime.utcnow()
    db.add(news)
    db.commit()
    db.refresh(news)

    return news
