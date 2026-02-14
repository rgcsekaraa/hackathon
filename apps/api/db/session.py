from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from contextlib import asynccontextmanager
from core.config import settings

# Create async engine for SQLite (aiosqlite)
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    # Needed for SQLite to handle multiple threads
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db():
    """Dependency for injecting database sessions into FastAPI routes."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context():
    """
    Async context manager for getting a DB session outside of FastAPI routes.

    Usage:
        async with get_db_context() as db:
            result = await db.execute(select(Model))
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
