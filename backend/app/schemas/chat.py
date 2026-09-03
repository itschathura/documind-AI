from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    document_id: str
    question: str


class SourceChunk(BaseModel):
    page: Optional[int] = None
    snippet: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk] = []