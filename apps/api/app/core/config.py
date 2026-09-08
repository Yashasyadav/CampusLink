from typing import Any, List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """CampusLink AI Application Configuration Settings."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Environment
    ENVIRONMENT: str = Field(default="development", description="Execution environment")
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    DEBUG: bool = Field(default=True, description="Debug flag")

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug_flag(cls, value: Any) -> Any:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "production", "prod"}:
                return False
            if normalized in {"development", "dev"}:
                return True
        return value

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
    GEMINI_MODEL: str = Field(default="gemini-3.8-flash")

    # Embeddings
    EMBEDDING_PROVIDER: str = Field(default="gemini")
    EMBEDDING_MODEL: str = Field(default="text-embedding-004")
    GEMINI_EMBEDDING_MODEL: str = Field(default="text-embedding-004")
    EMBEDDING_DIMENSION: int = Field(default=768)
    USE_FAKE_EMBEDDINGS: bool = Field(default=False)

    # Document & Storage Settings
    STORAGE_DIR: str = Field(default="storage/private/resumes")
    MAX_RESUME_SIZE_MB: int = Field(default=10)
    MAX_RESUME_SIZE_BYTES: int = Field(default=10 * 1024 * 1024)

    # Security
    JWT_SECRET: str = Field(default="dev_secret_key_campuslink_2026")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    COOKIE_SECURE: bool = Field(default=False)
    COOKIE_SAMESITE: str = Field(default="lax")

    # Matching & Explanation
    MATCHING_WEIGHTS: dict = Field(
        default={
            "semantic_relevance": 0.25,
            "skill_overlap": 0.20,
            "technology_overlap": 0.15,
            "project_evidence": 0.15,
            "solution_evidence": 0.15,
            "research_evidence": 0.10,
        }
    )


settings = Settings()
MATCHING_WEIGHTS = settings.MATCHING_WEIGHTS

