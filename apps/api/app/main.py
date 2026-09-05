from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import api_router
from app.schemas.health import HealthCheckResponse

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusLink AI — Enterprise Agentic Campus Discovery Platform API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthCheckResponse,
    tags=["System Health"],
    summary="Health check endpoint",
)
async def health_check() -> HealthCheckResponse:
    """Returns application health status."""
    return HealthCheckResponse(status="ok")


# Include API routers under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)
