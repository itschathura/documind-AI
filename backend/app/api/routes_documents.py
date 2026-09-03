from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import logging

from app.db.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentOut
from app.core.config import settings
from app.services.vector_store import delete_document_chunks

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[DocumentOut])
def list_documents(db: Session = Depends(get_db)):
    # Disabled for privacy: We do not allow scraping the global document list.
    # The frontend now uses localStorage to track user's own documents.
    raise HTTPException(status_code=403, detail="Global document listing is disabled for privacy.")


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # 1. Delete the physical file from disk
    file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.pdf")
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError as e:
        logger.warning(f"Could not delete file {file_path}: {e}")

    # 2. Delete vector chunks from ChromaDB
    try:
        delete_document_chunks(document_id)
    except Exception as e:
        logger.warning(f"Could not delete ChromaDB chunks for {document_id}: {e}")

    # 3. Delete the database row
    db.delete(doc)
    db.commit()
    return {"deleted": document_id}


@router.get("/{document_id}/summary")
def get_summary(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"document_id": document_id, "summary": doc.summary}