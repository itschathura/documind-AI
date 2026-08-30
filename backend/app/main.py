from fastapi import FastAPI

from app.core.config import settings
from app.db.database import engine, Base
from app.models import document
from backend.app.api import routes_documents  # registers the Document model

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
)

from app.api import routes_upload, routes_chat

app.include_router(routes_upload.router, prefix="/documents", tags=["documents"])
app.include_router(routes_chat.router, prefix="/chat", tags=["chat"])
app.include_router(routes_documents.router, prefix="/documents", tags=["documents"])


@app.get("/")
def root():
    return {"message": f"{settings.PROJECT_NAME} backend is running", "env": settings.ENV}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/yoyo")
def yoyo():
    return {"yoyo": settings.ENV}