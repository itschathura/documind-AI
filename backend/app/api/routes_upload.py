from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import shutil
import os
import uuid
import logging

from app.db.database import get_db
from app.models.document import Document
from app.services.extraction import extract_text
from app.services.chunking import chunk_text
from app.services.embeddings import embed_text
from app.services.vector_store import add_document_chunks
from app.services.rag_pipeline import generate_summary
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf"}
ALLOWED_MIME_TYPES = {"application/pdf"}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. File extension validation
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Only PDF files are allowed.",
        )

    # 2. MIME type validation
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only PDF files are allowed.",
        )

    # 3. File size validation
    file.file.seek(0, os.SEEK_END)
    file_size_mb = file.file.tell() / (1024 * 1024)
    file.file.seek(0)  # reset pointer back to start before reading
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.1f}MB). Max allowed is {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    doc_id = str(uuid.uuid4())
    secure_filename = f"{doc_id}.pdf"

    # 4. Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, secure_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 5. Create Document row
    doc = Document(id=doc_id, filename=file.filename, file_type="pdf", status="processing")
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 6. Processing pipeline — wrapped in try/except
    try:
        extracted_text = extract_text(file_path)

        if not extracted_text.strip():
            raise ValueError("No text could be extracted from this PDF (it may be scanned/image-only).")

        chunks = chunk_text(extracted_text, chunk_size=500, overlap=50)
        vectors = embed_text(chunks)
        add_document_chunks(document_id=doc.id, chunks=chunks, vectors=vectors)
        summary = generate_summary(extracted_text)

        doc.summary = summary
        doc.status = "ready"
        db.commit()

    except Exception as e:
        logger.error(f"Failed to process document {doc_id}: {e}", exc_info=True)
        doc.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to process document. Please try again or use a different file.")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "status": doc.status,
        "total_chunks": len(chunks),
        "summary": summary,
        "created_at": str(doc.created_at),
    }