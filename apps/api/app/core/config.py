from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """CampusLink AI Application Configuration Settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Environment
    ENVIRONMENT: str = Field(default="development", description="Execution environment")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    DEBUG: bool = Field(default=True, description="Debug flag")

    # API Settings
    PROJECT_NAME: str = "CampusLink AI"
    API_V1_STR: str = "/api/v1"

    # URLs
    FRONTEND_URL: str = Field(default="http://localhost:3000")
    BACKEND_URL: str = Field(default="http://localhost:8000")
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Database
    DATABASE_URL: Optional[str] = Field(
        default="postgresql+psycopg://campuslink:campuslink_dev_pass@localhost:5433/campuslink_db"
    )

    # AI & LLM Provider
    LLM_PROVIDER: str = Field(default="gemini")
    GEMINI_API_KEY: Optional[str] = Field(default=None)
    GEMINI_MODEL: str = Field(default="gemini-1.5-pro")

    # Embeddings
    EMBEDDING_PROVIDER: str = Field(default="gemini")
    EMBEDDING_MODEL: str = Field(default="text-embedding-004")
    EMBEDDING_DIMENSION: int = Field(default=768)

    # Security
    JWT_SECRET: str = Field(default="dev_secret_key_campuslink_2026")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    COOKIE_SECURE: bool = Field(default=False)
    COOKIE_SAMESITE: str = Field(default="lax")


settings = Settings()
