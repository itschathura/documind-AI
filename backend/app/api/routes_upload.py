# from fastapi import APIRouter, UploadFile, File, Depends
# from sqlalchemy.orm import Session
# import shutil
# import os

# from app.db.database import get_db
# from app.models.document import Document
# from app.services.extraction import extract_text
# from app.services.chunking import chunk_text
# from app.services.embeddings import embed_text
# from app.services.vector_store import add_document_chunks
# from app.services.rag_pipeline import generate_summary
# from app.core.config import settings

# router = APIRouter()


# @router.post("/upload")
# async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
#     # 1. File save
#     os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
#     file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     # 2. Postgres row create krnwa
#     doc = Document(filename=file.filename, file_type="pdf", status="processing")
#     db.add(doc)
#     db.commit()
#     db.refresh(doc)

#     # 3. Extract
#     extracted_text = extract_text(file_path)

#     # 4. Chunk
#     chunks = chunk_text(extracted_text, chunk_size=500, overlap=50)

#     # 5. Embed
#     vectors = embed_text(chunks)

#     # 6. Store in ChromaDB
#     add_document_chunks(document_id=doc.id, chunks=chunks, vectors=vectors)

#     # 7. Generate summary —  # new step (aluthen ekathu una)
#     summary = generate_summary(extracted_text)
#     doc.summary = summary

#     # 8. Status update
#     doc.status = "ready"
#     db.commit()

#     return {
#         "id": doc.id,
#         "filename": doc.filename,
#         "status": doc.status,
#         "total_chunks": len(chunks),
#         "vector_dimension": len(vectors[0]) if vectors else 0,
#         "summary": summary,
#     }
    
    
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import shutil
import os

from app.db.database import get_db
from app.models.document import Document
from app.services.extraction import extract_text
from app.services.chunking import chunk_text
from app.services.embeddings import embed_text
from app.services.vector_store import add_document_chunks
from app.services.rag_pipeline import generate_summary
from app.core.config import settings

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf"}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. File type validation
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Only PDF files are allowed.",
        )

    # 2. File size validation
    file.file.seek(0, os.SEEK_END)
    file_size_mb = file.file.tell() / (1024 * 1024)
    file.file.seek(0)  # reset pointer back to start before reading
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({file_size_mb:.1f}MB). Max allowed is {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # 3. Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Create Document row
    doc = Document(filename=file.filename, file_type="pdf", status="processing")
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 5. Processing pipeline — wrapped in try/except
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
        # Processing failed — mark as failed, keep the row for debugging, but tell the user clearly
        doc.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "total_chunks": len(chunks),
        "vector_dimension": len(vectors[0]) if vectors else 0,
        "summary": summary,
    }