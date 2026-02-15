"""
Bootstrap a default super-admin user for local/demo environments.
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy import select

from core.auth import get_password_hash
from core.config import settings
from db.session import get_db_context
from models.user import User

logger = logging.getLogger(__name__)


async def ensure_bootstrap_admin() -> None:
    """
    Ensure the configured bootstrap admin exists and can access Space.

    This intentionally keeps credentials deterministic for demo/dev flow.
    """
    if not settings.bootstrap_admin_enabled:
        return

    email = settings.bootstrap_admin_email.strip().lower()
    password = settings.bootstrap_admin_password
    if not email or not password:
        return

    async with get_db_context() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        hashed_password = get_password_hash(password)
        if user is None:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                full_name=settings.bootstrap_admin_name,
                hashed_password=hashed_password,
                role="admin",
                is_active=True,
                is_verified=True,
                verification_token=None,
            )
            db.add(user)
            logger.info("Bootstrap admin created: %s", email)
            return

        # Keep admin role and demo password in sync for predictable local login.
        user.role = "admin"
        user.is_active = True
        user.is_verified = True
        user.verification_token = None
        user.hashed_password = hashed_password
        if not user.full_name:
            user.full_name = settings.bootstrap_admin_name
        logger.info("Bootstrap admin verified: %s", email)
