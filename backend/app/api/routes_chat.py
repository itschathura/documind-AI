# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session

# from app.db.database import get_db
# from app.schemas.chat import ChatRequest, ChatResponse

# router = APIRouter()


# @router.post("", response_model=ChatResponse)
# async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db)):
#     """
#     TODO:
#       1. Embed request.question
#       2. Query vector store for relevant chunks
#       3. Build prompt + call LLM
#       4. Return answer + sources
#     """
#     return ChatResponse(answer="Not implemented yet", sources=[])



from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, SourceChunk
from app.services.rag_pipeline import answer_question

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db)):
    result = answer_question(document_id=request.document_id, question=request.question)

    sources = [SourceChunk(snippet=chunk[:200]) for chunk in result["sources"]]

    return ChatResponse(answer=result["answer"], sources=sources)