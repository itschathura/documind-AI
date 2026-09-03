import uuid
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    status = Column(String, default="uploaded")
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())