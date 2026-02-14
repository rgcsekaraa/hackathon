from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

class WorkspaceComponent(Base):
    __tablename__ = "workspace_components"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    priority: Mapped[str] = mapped_column(String, default="normal")
    date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    time_slot: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(default=0)
    
    # Store dynamic props or extra state as JSON
    meta: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project_id: Mapped[str | None] = mapped_column(String, ForeignKey("projects.id"), nullable=True)

    # Relations
    user: Mapped["User"] = relationship(back_populates="tasks")
    project: Mapped["Project"] = relationship(back_populates="components")

    def __repr__(self) -> str:
        return f"WorkspaceComponent(id={self.id!r}, title={self.title!r})"
