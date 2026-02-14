import logging
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from models.workspace import WorkspaceComponent

logger = logging.getLogger(__name__)

async def apply_intents_to_workspace(intents: list[dict], db: AsyncSession, user_id: str) -> list[dict]:
    """
    Take a list of AI-generated intents and apply them to the user's workspace in the DB.
    Returns a list of patch operations for broadcasting.
    """
    operations = []

    # Fetch existing tasks for resolution (simple for now)
    result = await db.execute(
        select(WorkspaceComponent)
        .where(WorkspaceComponent.user_id == user_id)
        .order_by(WorkspaceComponent.order_index)
    )
    existing_tasks = result.scalars().all()

    for intent in intents:
        intent_type = intent.get("type")

        if intent_type == "create_plan":
            items = intent.get("items", [])
            for item in items:
                comp = await _handle_create_task(item, db, user_id)
                if comp:
                    operations.append({"op": "add", "component": _model_to_dict(comp)})

        elif intent_type == "create_task":
            comp = await _handle_create_task(intent, db, user_id)
            if comp:
                operations.append({"op": "add", "component": _model_to_dict(comp)})

        elif intent_type == "set_priority":
            op = await _handle_set_priority(intent, db, user_id, existing_tasks)
            if op:
                operations.append(op)

        elif intent_type == "move_item":
            op = await _handle_move_item(intent, db, user_id, existing_tasks)
            if op:
                operations.append(op)

        elif intent_type == "delete_item":
            op = await _handle_delete_item(intent, db, user_id, existing_tasks)
            if op:
                operations.append(op)

        elif intent_type == "update_item":
            op = await _handle_update_item(intent, db, user_id, existing_tasks)
            if op:
                operations.append(op)

        elif intent_type == "mark_complete":
            op = await _handle_mark_complete(intent, db, user_id, existing_tasks)
            if op:
                operations.append(op)

        else:
            logger.warning("Unknown intent type: %s", intent_type)

    return operations


async def _handle_create_task(data: dict, db: AsyncSession, user_id: str) -> WorkspaceComponent:
    """Create a new task in the database."""
    # Get max order index
    result = await db.execute(select(WorkspaceComponent.order_index).where(WorkspaceComponent.user_id == user_id).order_by(WorkspaceComponent.order_index.desc()).limit(1))
    max_idx = result.scalar() or -1
    
    comp = WorkspaceComponent(
        id=str(uuid.uuid4())[:8],
        user_id=user_id,
        title=data.get("title", "Untitled"),
        description=data.get("description", ""),
        priority=data.get("priority", "normal"),
        date=data.get("date"),
        time_slot=data.get("timeSlot"),
        order_index=max_idx + 1
    )
    db.add(comp)
    await db.flush()
    return comp


async def _handle_set_priority(intent: dict, db: AsyncSession, user_id: str, tasks: list[WorkspaceComponent]) -> dict | None:
    target = intent.get("target", "")
    comp = _resolve_target(target, tasks)
    if not comp: return None

    priority = intent.get("priority", "normal")
    comp.priority = priority
    return {"op": "update", "componentId": comp.id, "changes": {"priority": priority}}


async def _handle_mark_complete(intent: dict, db: AsyncSession, user_id: str, tasks: list[WorkspaceComponent]) -> dict | None:
    target = intent.get("target", "")
    comp = _resolve_target(target, tasks)
    if not comp: return None

    completed = intent.get("completed", True)
    comp.completed = completed
    return {"op": "update", "componentId": comp.id, "changes": {"completed": completed}}


async def _handle_delete_item(intent: dict, db: AsyncSession, user_id: str, tasks: list[WorkspaceComponent]) -> dict | None:
    target = intent.get("target", "")
    comp = _resolve_target(target, tasks)
    if not comp: return None

    await db.delete(comp)
    return {"op": "remove", "componentId": comp.id}


async def _handle_move_item(intent: dict, db: AsyncSession, user_id: str, tasks: list[WorkspaceComponent]) -> dict | None:
    target = intent.get("target", "")
    comp = _resolve_target(target, tasks)
    if not comp: return None

    # For now, just update time/date if provided. Reordering is complex via AI.
    changes = {}
    if intent.get("date"):
        comp.date = intent["date"]
        changes["date"] = intent["date"]
    if intent.get("timeSlot"):
        comp.time_slot = intent["timeSlot"]
        changes["timeSlot"] = intent["timeSlot"]
    
    return {"op": "update", "componentId": comp.id, "changes": changes}


async def _handle_update_item(intent: dict, db: AsyncSession, user_id: str, tasks: list[WorkspaceComponent]) -> dict | None:
    target = intent.get("target", "")
    comp = _resolve_target(target, tasks)
    if not comp: return None

    changes = {}
    for field in ("title", "description", "date", "timeSlot"):
        if field in intent and intent[field] is not None:
            # Map camelCase to snake_case for the model
            model_field = "time_slot" if field == "timeSlot" else field
            setattr(comp, model_field, intent[field])
            changes[field] = intent[field]

    return {"op": "update", "componentId": comp.id, "changes": changes}


def _resolve_target(target: str, tasks: list[WorkspaceComponent]) -> WorkspaceComponent | None:
    target_lower = target.lower().strip()
    best_match = None
    best_score = 0

    for comp in tasks:
        title_lower = comp.title.lower()
        if title_lower == target_lower:
            return comp
        if target_lower in title_lower or title_lower in target_lower:
            score = len(target_lower) / max(len(title_lower), 1)
            if score > best_score:
                best_score = score
                best_match = comp
    
    return best_match


def _model_to_dict(comp: WorkspaceComponent) -> dict:
    """Convert a WorkspaceComponent model to the JSON format expected by the frontend."""
    return {
        "id": comp.id,
        "type": "task",
        "title": comp.title,
        "description": comp.description,
        "priority": comp.priority,
        "date": comp.date,
        "timeSlot": comp.time_slot,
        "completed": comp.completed,
        "createdAt": comp.created_at.isoformat(),
        "updatedAt": comp.updated_at.isoformat(),
    }
