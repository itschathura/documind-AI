from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.db.database import get_db
from app.models.document import Document
from app.schemas.chat import ChatRequest, ChatResponse, SourceChunk
from app.services.rag_pipeline import answer_question

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Check document exists and is ready
    doc = db.query(Document).filter(Document.id == request.document_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {request.document_id} not found.")

    if doc.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document is not ready yet (status: {doc.status}).",
        )

    # 2. Empty question check
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 3. RAG pipeline call
    try:
        result = answer_question(document_id=request.document_id, question=request.question)
    except Exception as e:
        logger.error(f"AI service error for doc {request.document_id}: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")

    sources = [SourceChunk(snippet=chunk[:200]) for chunk in result["sources"]]
    return ChatResponse(answer=result["answer"], sources=sources)