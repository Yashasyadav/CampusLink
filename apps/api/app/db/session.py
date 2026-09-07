import sys
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings

raw_db_url = settings.DATABASE_URL or "postgresql+psycopg://campuslink:campuslink_dev_pass@localhost:5433/campuslink_db"

def _get_async_url(url: str) -> str:
    if url.startswith("postgresql+psycopg://"):
        return url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url

def _get_sync_url(url: str) -> str:
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url

async_db_url = _get_async_url(raw_db_url)
sync_db_url = _get_sync_url(raw_db_url)

# Async Engine Configuration
async_engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}
if "pytest" in sys.modules or settings.ENVIRONMENT == "testing":
    async_engine_kwargs["poolclass"] = NullPool
else:
    async_engine_kwargs["pool_pre_ping"] = True
    async_engine_kwargs["pool_recycle"] = 300

async_engine = create_async_engine(
    async_db_url,
    **async_engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

sync_engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}
if "pytest" in sys.modules or settings.ENVIRONMENT == "testing":
    sync_engine_kwargs["poolclass"] = NullPool
else:
    sync_engine_kwargs["pool_pre_ping"] = True
    sync_engine_kwargs["pool_recycle"] = 300

sync_engine = create_engine(
    sync_db_url,
    **sync_engine_kwargs
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency Injection provider for async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
