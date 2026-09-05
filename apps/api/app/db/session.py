import sys
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from app.core.config import settings

# Async Database URL (uses asyncpg for high-performance async execution across all platforms)
async_db_url = settings.DATABASE_URL or "postgresql+asyncpg://campuslink:campuslink_dev_pass@localhost:5433/campuslink_db"
if async_db_url.startswith("postgresql+psycopg://"):
    async_db_url = async_db_url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
elif async_db_url.startswith("postgresql://"):
    async_db_url = async_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# In test mode, NullPool prevents event loop mismatch across pytest-asyncio test runs
async_engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}
if "pytest" in sys.modules or settings.ENVIRONMENT == "testing":
    async_engine_kwargs["poolclass"] = NullPool
else:
    async_engine_kwargs["pool_pre_ping"] = True

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

# Sync Database URL (uses psycopg for sync migrations & tools)
sync_db_url = async_db_url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)

sync_engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}
if "pytest" in sys.modules or settings.ENVIRONMENT == "testing":
    sync_engine_kwargs["poolclass"] = NullPool
else:
    sync_engine_kwargs["pool_pre_ping"] = True

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
