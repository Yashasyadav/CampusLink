from pydantic import BaseModel


class HealthCheckResponse(BaseModel):
    """Response schema for GET /health endpoint."""
    status: str = "ok"
