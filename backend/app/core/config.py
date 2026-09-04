from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind AI"
    ENV: str = "development"

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    DATABASE_URL: str

    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "gemini-flash-lite-latest"

    UPLOAD_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    VECTOR_DB_PROVIDER: str = "chroma"
    VECTOR_DB_PATH: str = "./data/vector_store"

    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "documents"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()