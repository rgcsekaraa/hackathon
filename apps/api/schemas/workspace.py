"""
Pydantic schemas for workspace data.

These mirror the shared TypeScript types and are used for
request/response validation on the API side.
"""

from enum import Enum

from pydantic import BaseModel, Field


class ComponentType(str, Enum):
    timeline = "timeline"
    task = "task"
    note = "note"


class Priority(str, Enum):
    urgent = "urgent"
    high = "high"
    normal = "normal"
    low = "low"


class WorkspaceComponent(BaseModel):
    id: str
    type: ComponentType
    title: str
    description: str = ""
    priority: Priority = Priority.normal
    date: str | None = None
    time_slot: str | None = Field(None, alias="timeSlot")
    completed: bool = False
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")

    model_config = {"populate_by_name": True}


class WorkspaceMeta(BaseModel):
    active_id: str | None = Field(None, alias="activeId")
    last_entities: dict[str, str] = Field(default_factory=dict, alias="lastEntities")
    session_id: str = Field(alias="sessionId")

    model_config = {"populate_by_name": True}
