from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relations
    user: Mapped["User"] = relationship(back_populates="projects")
    components: Mapped[list["WorkspaceComponent"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"Project(id={self.id!r}, name={self.name!r})"
