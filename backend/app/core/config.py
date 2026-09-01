from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind AI"
    ENV: str = "development"

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/documind"

    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.6-flash"

    UPLOAD_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25

    VECTOR_DB_PROVIDER: str = "chroma"
    VECTOR_DB_PATH: str = "./data/vector_store"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()