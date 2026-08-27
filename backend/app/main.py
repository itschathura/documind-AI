from fastapi import FastAPI
from app.core.config import settings
from app.db.database import engine, Base
from app.models import document  # registers the Document model

from app.core.config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
)


@app.get("/")
def root():
    return {"message": f"{settings.PROJECT_NAME} backend is running", "env": settings.ENV}


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/yoyo")
def yoyo():
    return {"yoyo" : settings.ENV}