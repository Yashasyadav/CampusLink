from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import api_router
from app.schemas.health import HealthCheckResponse
from app.db.session import AsyncSessionLocal

setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CampusLink AI — Enterprise Agentic Campus Discovery Platform API",
    version="0.2.0",
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
    summary="Health check endpoint with database and pgvector verification",
)
async def health_check() -> HealthCheckResponse:
    """Returns application status, database connectivity, and pgvector extension state."""
    db_status = "unhealthy"
    vector_status = "unavailable"
    pg_version = None

    try:
        async with AsyncSessionLocal() as session:
            # Test connectivity and fetch postgres version
            result = await session.execute(text("SELECT version();"))
            version_str = result.scalar()
            if version_str:
                db_status = "healthy"
                # Extract simple version prefix (e.g., PostgreSQL 16.x)
                pg_version = version_str.split()[0] + " " + version_str.split()[1]

            # Test pgvector availability
            vector_result = await session.execute(
                text("SELECT extname FROM pg_extension WHERE extname = 'vector';")
            )
            if vector_result.scalar():
                vector_status = "available"

    except Exception:
        db_status = "disconnected"

    gemini_status = "configured" if (settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip()) else "unconfigured"

    return HealthCheckResponse(
        status="ok" if db_status == "healthy" else "degraded",
        database=db_status,
        pgvector=vector_status,
        postgres_version=pg_version,
        gemini=gemini_status,
    )


# Include API routers under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)
