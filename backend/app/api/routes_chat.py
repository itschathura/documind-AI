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



# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session

# from app.db.database import get_db
# from app.schemas.chat import ChatRequest, ChatResponse, SourceChunk
# from app.services.rag_pipeline import answer_question

# router = APIRouter()


# @router.post("", response_model=ChatResponse)
# async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db)):
#     result = answer_question(document_id=request.document_id, question=request.question)

#     sources = [SourceChunk(snippet=chunk[:200]) for chunk in result["sources"]]

#     return ChatResponse(answer=result["answer"], sources=sources)


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.schemas.chat import ChatRequest, ChatResponse, SourceChunk
from app.services.rag_pipeline import answer_question

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat_with_document(request: ChatRequest, db: Session = Depends(get_db)):
    # 1. Document එක exist කරනවද, "ready" status එකේද check කරන්න
    doc = db.query(Document).filter(Document.id == request.document_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {request.document_id} not found.")

    if doc.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Document {request.document_id} is not ready yet (status: {doc.status}).",
        )

    # 2. Empty question check
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # 3. RAG pipeline call — LLM errors handle කරමු
    try:
        result = answer_question(document_id=request.document_id, question=request.question)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    sources = [SourceChunk(snippet=chunk[:200]) for chunk in result["sources"]]
    return ChatResponse(answer=result["answer"], sources=sources)


# Code	Meaning	
# 400	Bad Request — user >  mistake	Invalid file type, empty question
# 404	Not Found	Document ID ekak no exist
# 500	Internal Server Error	code eke awylk
# 502	Bad Gateway	External service (Gemini API) fail