from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind AI"
    ENV: str = "development"

    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/documind"

    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "claude-sonnet-4-6"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()