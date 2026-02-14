from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base

class TokenBlacklist(Base):
    """
    Simpler session management: stores invalidated JWT JTI (JWT ID) or raw tokens.
    For the hackathon, we store the token string with an expiry.
    """
    __tablename__ = "token_blacklist"

    token: Mapped[str] = mapped_column(String, primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)

    def __repr__(self) -> str:
        return f"TokenBlacklist(token={self.token[:10]}...)"
