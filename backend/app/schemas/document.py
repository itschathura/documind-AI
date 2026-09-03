from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DocumentOut(BaseModel):
    id: str
    filename: str
    file_type: str
    status: str
    summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True