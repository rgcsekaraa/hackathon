"""
Workspace service -- converts AI intents into deterministic workspace operations.

This is the core reliability mechanism: the LLM outputs natural language targets
(like "Henderson") and this service resolves them to actual component IDs using
fuzzy matching against the current workspace state. No hallucinated IDs.
"""

import logging
import uuid
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


def apply_intents_to_workspace(intents: list[dict], workspace: dict) -> list[dict]:
    """
    Take a list of AI-generated intents and apply them to the workspace.

    Returns a list of patch operations that were applied. These get broadcast
    to all clients so they can update their local state.
    """
    operations = []

    for intent in intents:
        intent_type = intent.get("type")

        if intent_type == "create_plan":
            ops = _handle_create_plan(intent, workspace)
            operations.extend(ops)

        elif intent_type == "create_task":
            op = _handle_create_task(intent, workspace)
            if op:
                operations.append(op)

        elif intent_type == "create_note":
            op = _handle_create_note(intent, workspace)
            if op:
                operations.append(op)

        elif intent_type == "set_priority":
            op = _handle_set_priority(intent, workspace)
            if op:
                operations.append(op)

        elif intent_type == "move_item":
            op = _handle_move_item(intent, workspace)
            if op:
                operations.append(op)

        elif intent_type == "delete_item":
            op = _handle_delete_item(intent, workspace)
            if op:
                operations.append(op)

        elif intent_type == "update_item":
            op = _handle_update_item(intent, workspace)
            if op:
                operations.append(op)

        elif intent_type == "mark_complete":
            op = _handle_mark_complete(intent, workspace)
            if op:
                operations.append(op)

        else:
            logger.warning("Unknown intent type: %s", intent_type)

    return operations


def _make_component(
    comp_type: str,
    title: str,
    description: str = "",
    date: str | None = None,
    time_slot: str | None = None,
    priority: str = "normal",
) -> dict:
    """Build a new workspace component with generated ID and timestamps."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid.uuid4())[:8],
        "type": comp_type,
        "title": title,
        "description": description,
        "priority": priority,
        "date": date,
        "timeSlot": time_slot,
        "completed": False,
        "createdAt": now,
        "updatedAt": now,
    }


def _resolve_target(target: str, workspace: dict) -> str | None:
    """
    Find a component ID by matching the target string against component titles.

    Uses case-insensitive substring matching. Returns the best match,
    or None if nothing matches.
    """
    target_lower = target.lower().strip()
    components = workspace.get("components", {})
    order = workspace.get("order", [])

    # Check entity cache first for fast lookups
    last_entities = workspace.get("meta", {}).get("lastEntities", {})
    if target_lower in last_entities:
        cached_id = last_entities[target_lower]
        if cached_id in components:
            return cached_id

    # Fuzzy match against titles
    best_match = None
    best_score = 0

    for cid in order:
        comp = components.get(cid)
        if not comp:
            continue

        title_lower = comp.get("title", "").lower()

        # Exact match wins immediately
        if title_lower == target_lower:
            return cid

        # Substring match with length-based scoring
        if target_lower in title_lower or title_lower in target_lower:
            score = len(target_lower) / max(len(title_lower), 1)
            if score > best_score:
                best_score = score
                best_match = cid

    if best_match:
        # Cache this resolution for faster lookups on follow-up commands
        if "meta" not in workspace:
            workspace["meta"] = {"activeId": None, "lastEntities": {}, "sessionId": "default"}
        workspace["meta"]["lastEntities"][target_lower] = best_match

    return best_match


# -- Intent handlers --

def _handle_create_plan(intent: dict, workspace: dict) -> list[dict]:
    """Create multiple items from a plan intent."""
    items = intent.get("items", [])
    operations = []

    for item in items:
        comp = _make_component(
            comp_type="task",
            title=item.get("title", "Untitled"),
            description=item.get("description", ""),
            date=item.get("date"),
            time_slot=item.get("timeSlot"),
            priority=item.get("priority", "normal"),
        )

        # Apply to workspace state
        workspace["components"][comp["id"]] = comp
        workspace["order"].append(comp["id"])

        operations.append({"op": "add", "component": comp, "index": len(workspace["order"]) - 1})

    return operations


def _handle_create_task(intent: dict, workspace: dict) -> dict | None:
    """Create a single task."""
    comp = _make_component(
        comp_type="task",
        title=intent.get("title", "Untitled"),
        description=intent.get("description", ""),
        date=intent.get("date"),
        time_slot=intent.get("timeSlot"),
        priority=intent.get("priority", "normal"),
    )

    workspace["components"][comp["id"]] = comp
    workspace["order"].append(comp["id"])

    return {"op": "add", "component": comp, "index": len(workspace["order"]) - 1}


def _handle_create_note(intent: dict, workspace: dict) -> dict | None:
    """Create a note component."""
    comp = _make_component(
        comp_type="note",
        title=intent.get("title", "Note"),
        description=intent.get("description", ""),
    )

    workspace["components"][comp["id"]] = comp
    workspace["order"].append(comp["id"])

    return {"op": "add", "component": comp, "index": len(workspace["order"]) - 1}


def _handle_set_priority(intent: dict, workspace: dict) -> dict | None:
    """Change the priority of an existing item."""
    target = intent.get("target", "")
    cid = _resolve_target(target, workspace)

    if not cid:
        logger.warning("Could not resolve target '%s' for set_priority", target)
        return None

    new_priority = intent.get("priority", "normal")
    workspace["components"][cid]["priority"] = new_priority
    workspace["components"][cid]["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {"op": "update", "componentId": cid, "changes": {"priority": new_priority}}


def _handle_move_item(intent: dict, workspace: dict) -> dict | None:
    """Move an item to a new position or time slot."""
    target = intent.get("target", "")
    cid = _resolve_target(target, workspace)

    if not cid:
        logger.warning("Could not resolve target '%s' for move_item", target)
        return None

    position = intent.get("position")
    order = workspace["order"]

    if cid in order:
        order.remove(cid)

    if position == "first":
        new_index = 0
    elif position == "last":
        new_index = len(order)
    elif isinstance(position, int):
        new_index = min(position, len(order))
    else:
        new_index = 0

    order.insert(new_index, cid)

    # Also update date/time if provided
    changes = {}
    if intent.get("date"):
        workspace["components"][cid]["date"] = intent["date"]
        changes["date"] = intent["date"]
    if intent.get("timeSlot"):
        workspace["components"][cid]["timeSlot"] = intent["timeSlot"]
        changes["timeSlot"] = intent["timeSlot"]

    workspace["components"][cid]["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {"op": "reorder", "componentId": cid, "newIndex": new_index}


def _handle_delete_item(intent: dict, workspace: dict) -> dict | None:
    """Remove an item from the workspace."""
    target = intent.get("target", "")
    cid = _resolve_target(target, workspace)

    if not cid:
        logger.warning("Could not resolve target '%s' for delete_item", target)
        return None

    workspace["components"].pop(cid, None)
    if cid in workspace["order"]:
        workspace["order"].remove(cid)

    return {"op": "remove", "componentId": cid}


def _handle_update_item(intent: dict, workspace: dict) -> dict | None:
    """Update specific fields of an existing item."""
    target = intent.get("target", "")
    cid = _resolve_target(target, workspace)

    if not cid:
        logger.warning("Could not resolve target '%s' for update_item", target)
        return None

    changes = {}
    for field in ("title", "description", "date", "timeSlot"):
        if field in intent and intent[field] is not None:
            workspace["components"][cid][field] = intent[field]
            changes[field] = intent[field]

    workspace["components"][cid]["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {"op": "update", "componentId": cid, "changes": changes}


def _handle_mark_complete(intent: dict, workspace: dict) -> dict | None:
    """Toggle the completion status of an item."""
    target = intent.get("target", "")
    cid = _resolve_target(target, workspace)

    if not cid:
        logger.warning("Could not resolve target '%s' for mark_complete", target)
        return None

    completed = intent.get("completed", True)
    workspace["components"][cid]["completed"] = completed
    workspace["components"][cid]["updatedAt"] = datetime.now(timezone.utc).isoformat()

    return {"op": "update", "componentId": cid, "changes": {"completed": completed}}
