# backend/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from .models import ReportStatus


from .models import ReportStatus


class ReportMediaOut(BaseModel):
    id: int
    file_name: str
    media_type: str
    order: int

    class Config:
        orm_mode = True

class ReportCommentMediaOut(BaseModel):
    id: int
    file_name: str
    media_type: str
    order: int

    class Config:
        orm_mode = True


class ReportCommentCreate(BaseModel):
    author: Optional[str] = None
    content: str


class ReportCommentOut(BaseModel):
    id: int
    author: Optional[str] = None
    content: str
    created_at: datetime
    # 👇 nueva lista de evidencias del comentario
    media: List[ReportCommentMediaOut] = []
    class Config:
        orm_mode = True


class ReportBase(BaseModel):
    latitude: float
    longitude: float
    description: str


class ReportOut(BaseModel):
    # ID numérico y hash
    id: int
    public_id: str
    citizen_email: Optional[EmailStr] = None
    latitude: float
    longitude: float
    description: str
    status: ReportStatus
    created_at: datetime
    updated_at: datetime

    media: List[ReportMediaOut] = []
    comments: List[ReportCommentOut] = []

    class Config:
        orm_mode = True


class ReportStatusUpdate(BaseModel):
    status: ReportStatus

class RequestCodeInput(BaseModel):
    email: EmailStr