from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db)):
    """
    TODO:
      1. Embed request.question
      2. Query vector store for relevant chunks
      3. Build prompt + call LLM
      4. Return answer + sources
    """
    return ChatResponse(answer="Not implemented yet", sources=[])