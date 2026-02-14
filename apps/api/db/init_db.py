import logging
from .session import engine
from models.base import Base

logger = logging.getLogger(__name__)

async def init_db():
    """Create all tables in the database if they don't exist."""
    try:
        async with engine.begin() as conn:
            # Re-import all models to ensure they are registered with Base
            import models  # noqa: F401
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize database tables: %s", e)
        raise
