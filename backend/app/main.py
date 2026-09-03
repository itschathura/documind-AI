from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import engine, Base
from app.models import document  # registers the Document model

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
)

# CORS — only allow frontend origin with specific methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

from app.api import routes_upload, routes_chat, routes_documents

app.include_router(routes_upload.router, prefix="/documents", tags=["documents"])
app.include_router(routes_chat.router, prefix="/chat", tags=["chat"])
app.include_router(routes_documents.router, prefix="/documents", tags=["documents"])


@app.get("/")
def root():
    return {"message": f"{settings.PROJECT_NAME} backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}