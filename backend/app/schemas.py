# backend/app/schemas.py
from datetime import datetime
from pydantic import BaseModel, EmailStr,Field
from typing import List, Optional
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
    media: List[ReportCommentMediaOut] = Field(default_factory=list)
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

    media: List[ReportMediaOut] = Field(default_factory=list)
    comments: List[ReportCommentOut] = Field(default_factory=list)

    class Config:
        orm_mode = True


class ReportStatusUpdate(BaseModel):
    status: ReportStatus

class RequestCodeInput(BaseModel):
    email: EmailStr

class UserLoginInput(BaseModel):
    username: str
    password: str


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class VisitorPing(BaseModel):
    device_token: str


class NewsMediaOut(BaseModel):
    id: int
    file_name: str
    media_type: str
    order: int

    class Config:
        orm_mode = True


class NewsOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    media: List[NewsMediaOut] = Field(default_factory=list)

    class Config:
        orm_mode = True
