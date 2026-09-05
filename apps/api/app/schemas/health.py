from typing import Optional
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    """Response schema for GET /health endpoint."""

    status: str = Field(default="ok", description="Application status")
    database: str = Field(default="unknown", description="Database connectivity status")
    pgvector: str = Field(default="unknown", description="pgvector extension status")
    postgres_version: Optional[str] = Field(default=None, description="PostgreSQL engine version string")
    gemini: Optional[str] = Field(default="unconfigured", description="Gemini API provider configuration status")
