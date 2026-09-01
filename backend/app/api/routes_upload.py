from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import shutil
import os

from app.db.database import get_db
from app.models.document import Document
from app.services.extraction import extract_text
from app.services.chunking import chunk_text
from app.services.embeddings import embed_text
from app.services.vector_store import add_document_chunks #new
from app.core.config import settings

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. File save
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Postgres row 
    doc = Document(filename=file.filename, file_type="pdf", status="processing")
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 3. Extract
    extracted_text = extract_text(file_path)

    # 4. Chunk
    chunks = chunk_text(extracted_text, chunk_size=500, overlap=50)

    # 5. Embed
    vectors = embed_text(chunks)

    # 6. Store in ChromaDB — new
    add_document_chunks(document_id=doc.id, chunks=chunks, vectors=vectors)  #new

    # 7. Status update
    doc.status = "ready"
    db.commit()

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "total_chunks": len(chunks),
        "vector_dimension": len(vectors[0]) if vectors else 0,
    }