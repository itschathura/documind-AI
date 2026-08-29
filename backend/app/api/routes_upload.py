from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import shutil
import os

from app.db.database import get_db
from app.models.document import Document
from app.services.extraction import extract_text
from app.core.config import settings

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(filename=file.filename, file_type="pdf", status="processing")
    db.add(doc)
    db.commit()
    db.refresh(doc)

    extracted_text = extract_text(file_path)

    doc.status = "ready"
    db.commit()

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "extracted_chars": len(extracted_text),
        "preview": extracted_text[:300],
    }