# backend/app/api/analytics.py
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models, schemas


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/visits")
def register_visit(payload: schemas.VisitorPing, db: Session = Depends(get_db)):
    token = payload.device_token.strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="device_token es requerido",
        )

    visitor = (
        db.query(models.Visitor)
        .filter(models.Visitor.device_token == token)
        .first()
    )

    now = datetime.utcnow()
    if visitor:
        visitor.last_seen_at = now
        db.commit()
        return {"is_new": False}

    visitor = models.Visitor(device_token=token, first_seen_at=now, last_seen_at=now)
    db.add(visitor)
    db.commit()
    return {"is_new": True}


@router.get("/visits/count")
def get_visit_count(db: Session = Depends(get_db)):
    total = db.query(models.Visitor).count()
    return {"total": total}
