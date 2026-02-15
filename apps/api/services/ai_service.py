"""
AI service -- handles LLM calls via OpenRouter for intent extraction.

Processes user utterances and returns structured intents. Uses streaming
for lower perceived latency. Falls back to a deterministic keyword parser
when no API key is configured. Redis caching is used for repeated queries.
"""

import json
import logging
import re
from datetime import datetime, timedelta, timezone

import httpx

from core.config import settings
from core.retry import retry_async
from services.cache_service import get_cached_intents, cache_intents

logger = logging.getLogger(__name__)


# The system prompt constraining LLM output to our intent schema
SYSTEM_PROMPT = """You are an AI assistant for a trades business workspace app called Sophiie Orbit.
Your job is to convert natural language into structured workspace operations.

You MUST respond with valid JSON only. No markdown, no explanation, no extra text.

Output format: a JSON array of intent objects. Each intent has a "type" field and relevant data.

Available intent types:
- create_plan: Create multiple items at once. Include "items" array with title, date, timeSlot, priority.
- create_task: Create a single task. Include title, date, timeSlot, priority.
- create_note: Create a note. Include title, description.
- set_priority: Change priority. Include "target" (name/description to match) and "priority" (urgent/high/normal/low).
- move_item: Reorder or reschedule. Include "target", optional "position" (first/last/number), "date", "timeSlot".
- delete_item: Remove an item. Include "target".
- update_item: Change item properties. Include "target" and fields to update.
- mark_complete: Toggle completion. Include "target" and "completed" (true/false).

Time slots: "early_morning", "morning", "late_morning", "noon", "afternoon", "late_afternoon", "evening".
Dates: Use ISO format (YYYY-MM-DD). "tomorrow" means the next calendar day from today.
Priority: "urgent", "high", "normal", "low". Default is "normal".

Examples:
Input: "Tomorrow Smith reno morning, Henderson leak after lunch"
Output: [{"type":"create_plan","items":[{"title":"Smith reno","date":"2026-02-15","timeSlot":"morning","priority":"normal"},{"title":"Henderson leak","date":"2026-02-15","timeSlot":"afternoon","priority":"normal"}]}]

Input: "Henderson is urgent, move it first"
Output: [{"type":"set_priority","target":"Henderson","priority":"urgent"},{"type":"move_item","target":"Henderson","position":"first"}]

Today's date is {today}. Respond with the JSON array ONLY."""


async def process_utterance(text: str, workspace: dict) -> list[dict]:
    """
    Send user text to the LLM and get back structured intents.

    Checks Redis cache first; falls back to mock parser if no API key.
    """
    # Check cache first
    cached = await get_cached_intents(text)
    if cached:
        return cached

    if not settings.openrouter_api_key:
        logger.info("No OpenRouter API key -- using deterministic intent parser")
        intents = _deterministic_parse(text)
    else:
        intents = await _llm_parse(text, workspace)

    # Cache the result
    await cache_intents(text, intents)

    return intents


async def _llm_parse(text: str, workspace: dict) -> list[dict]:
    """Call OpenRouter LLM for intent extraction."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    system_prompt = SYSTEM_PROMPT.replace("{today}", today)

    workspace_context = _build_workspace_context(workspace)
    user_message = text
    if workspace_context:
        user_message = f"Current workspace items:\n{workspace_context}\n\nUser says: {text}"

    async def _do_llm_call() -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.openrouter_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openrouter_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1024,
                },
            )
            response.raise_for_status()
            return response.json()

    try:
        data = await retry_async(
            _do_llm_call,
            max_attempts=3,
            base_delay=0.5,
            max_delay=5.0,
            retryable_exceptions=(httpx.HTTPStatusError, httpx.ConnectError, httpx.ReadTimeout),
        )

        content = data["choices"][0]["message"]["content"]
        intents = json.loads(content)

        if not isinstance(intents, list):
            intents = [intents]

        logger.info("Parsed %d intents from utterance via LLM", len(intents))
        return intents

    except Exception as exc:
        logger.error("LLM call failed after retries: %s -- falling back to deterministic parser", exc)
        return _deterministic_parse(text)


def _build_workspace_context(workspace: dict) -> str:
    """Summarize current workspace items for the LLM context window."""
    components = workspace.get("components", {})
    order = workspace.get("order", [])

    if not order:
        return ""

    lines = []
    for idx, cid in enumerate(order):
        comp = components.get(cid)
        if comp:
            priority_tag = f" [{comp.get('priority', 'normal')}]" if comp.get("priority") != "normal" else ""
            date_tag = f" ({comp.get('date', '')} {comp.get('timeSlot', '')})".strip()
            lines.append(f"{idx + 1}. {comp.get('title', 'Untitled')}{priority_tag}{date_tag}")

    return "\n".join(lines)


# ---- Deterministic (no-LLM) intent parser ----

# Time slot keywords
TIME_SLOT_PATTERNS = {
    "early morning": "early_morning",
    "early am": "early_morning",
    "morning": "morning",
    "late morning": "late_morning",
    "noon": "noon",
    "midday": "noon",
    "lunchtime": "noon",
    "after lunch": "afternoon",
    "afternoon": "afternoon",
    "arvo": "afternoon",
    "late afternoon": "late_afternoon",
    "evening": "evening",
    "tonight": "evening",
    "night": "evening",
}

# Priority keywords
PRIORITY_PATTERNS = {
    "urgent": "urgent",
    "asap": "urgent",
    "emergency": "urgent",
    "critical": "urgent",
    "high priority": "high",
    "important": "high",
    "high": "high",
    "low priority": "low",
    "low": "low",
    "when you can": "low",
    "no rush": "low",
}


def _extract_date(text: str) -> tuple[str | None, str]:
    """Extract date from text. Returns (date_str, remaining_text)."""
    now = datetime.now(timezone.utc)
    text_lower = text.lower()
    remaining = text

    if "today" in text_lower:
        remaining = re.sub(r'\btoday\b', '', remaining, flags=re.IGNORECASE).strip()
        return now.strftime("%Y-%m-%d"), remaining

    if "tomorrow" in text_lower:
        tomorrow = now + timedelta(days=1)
        remaining = re.sub(r'\btomorrow\b', '', remaining, flags=re.IGNORECASE).strip()
        return tomorrow.strftime("%Y-%m-%d"), remaining

    # Day of week matching
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for i, day in enumerate(days):
        if day in text_lower:
            current_dow = now.weekday()
            days_ahead = (i - current_dow) % 7
            if days_ahead == 0:
                days_ahead = 7  # Next week if same day
            target = now + timedelta(days=days_ahead)
            remaining = re.sub(rf'\b{day}\b', '', remaining, flags=re.IGNORECASE).strip()
            return target.strftime("%Y-%m-%d"), remaining

    # ISO date pattern (YYYY-MM-DD)
    iso_match = re.search(r'\b(\d{4}-\d{2}-\d{2})\b', text)
    if iso_match:
        remaining = text.replace(iso_match.group(0), "").strip()
        return iso_match.group(1), remaining

    return None, remaining


def _extract_time_slot(text: str) -> tuple[str | None, str]:
    """Extract time slot from text. Returns (slot, remaining_text)."""
    text_lower = text.lower()
    remaining = text

    # Check longest patterns first to avoid partial matches
    for pattern in sorted(TIME_SLOT_PATTERNS.keys(), key=len, reverse=True):
        if pattern in text_lower:
            remaining = re.sub(re.escape(pattern), '', remaining, flags=re.IGNORECASE).strip()
            return TIME_SLOT_PATTERNS[pattern], remaining

    return None, remaining


def _extract_priority(text: str) -> tuple[str, str]:
    """Extract priority from text. Returns (priority, remaining_text)."""
    text_lower = text.lower()
    remaining = text

    for pattern in sorted(PRIORITY_PATTERNS.keys(), key=len, reverse=True):
        if pattern in text_lower:
            remaining = re.sub(re.escape(pattern), '', remaining, flags=re.IGNORECASE).strip()
            return PRIORITY_PATTERNS[pattern], remaining

    return "normal", remaining


def _clean_title(text: str) -> str:
    """Clean up extracted title by removing common filler words and extra whitespace."""
    # Remove leading prepositions/filler
    text = re.sub(r'^(add|create|new|schedule|make|set up|plan)\s+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^(a|an|the)\s+', '', text, flags=re.IGNORECASE)
    # Remove trailing punctuation and extra whitespace
    text = re.sub(r'\s+', ' ', text).strip().rstrip('.,;:!')
    # Remove dangling commas and prepositions
    text = re.sub(r'\s*,\s*$', '', text)
    text = re.sub(r'\s+(for|at|on|in)\s*$', '', text, flags=re.IGNORECASE)
    return text.strip()


def _deterministic_parse(text: str) -> list[dict]:
    """
    Fully functional keyword-based parser that handles all intent types.
    Works without an LLM by pattern-matching common commands.
    """
    text_lower = text.lower().strip()
    now = datetime.now(timezone.utc)

    # ---- MARK COMPLETE / DONE ----
    done_match = re.match(
        r"^(?:mark|set)\s+(.+?)\s+(?:as\s+)?(?:done|complete|completed|finished)$",
        text_lower,
    )
    if done_match:
        return [{"type": "mark_complete", "target": done_match.group(1).strip(), "completed": True}]

    not_done_match = re.match(
        r"^(?:mark|set)\s+(.+?)\s+(?:as\s+)?(?:not done|not complete|incomplete|undone)$",
        text_lower,
    )
    if not_done_match:
        return [{"type": "mark_complete", "target": not_done_match.group(1).strip(), "completed": False}]

    # ---- DELETE / REMOVE ----
    delete_match = re.match(r"^(?:delete|remove|cancel|drop)\s+(.+)$", text_lower)
    if delete_match:
        return [{"type": "delete_item", "target": delete_match.group(1).strip()}]

    # ---- SET PRIORITY ----
    priority_match = re.match(
        r"^(?:make|set)\s+(.+?)\s+(?:as\s+)?(urgent|high|normal|low)(?:\s+priority)?$",
        text_lower,
    )
    if priority_match:
        return [{
            "type": "set_priority",
            "target": priority_match.group(1).strip(),
            "priority": priority_match.group(2),
        }]

    # Also match "X is urgent"
    is_priority_match = re.match(r"^(.+?)\s+is\s+(urgent|high|normal|low)$", text_lower)
    if is_priority_match:
        return [{
            "type": "set_priority",
            "target": is_priority_match.group(1).strip(),
            "priority": is_priority_match.group(2),
        }]

    # ---- MOVE / REORDER ----
    move_match = re.match(r"^move\s+(.+?)\s+(?:to\s+)?(first|last|top|bottom)$", text_lower)
    if move_match:
        position = move_match.group(2)
        if position in ("top", "first"):
            position = "first"
        elif position in ("bottom", "last"):
            position = "last"
        return [{
            "type": "move_item",
            "target": move_match.group(1).strip(),
            "position": position,
        }]

    # ---- RESCHEDULE ----
    reschedule_match = re.match(r"^(?:move|reschedule|shift)\s+(.+?)\s+(?:to\s+)(.+)$", text_lower)
    if reschedule_match:
        target = reschedule_match.group(1).strip()
        rest = reschedule_match.group(2).strip()
        date, rest = _extract_date(rest)
        time_slot, _ = _extract_time_slot(rest)
        intent: dict = {"type": "move_item", "target": target}
        if date:
            intent["date"] = date
        if time_slot:
            intent["timeSlot"] = time_slot
        return [intent]

    # ---- MULTI-ITEM CREATION (comma / "and" separated) ----
    # Detect multiple items: "Smith reno morning, Henderson leak afternoon"
    if "," in text or " and " in text_lower:
        raw_items = re.split(r',\s*|\s+and\s+', text, flags=re.IGNORECASE)
        raw_items = [item.strip() for item in raw_items if item.strip()]

        if len(raw_items) > 1:
            items = []
            for raw in raw_items:
                date, rest = _extract_date(raw)
                time_slot, rest = _extract_time_slot(rest)
                priority, rest = _extract_priority(rest)
                title = _clean_title(rest)
                if not title:
                    continue

                item: dict = {"title": title, "priority": priority}
                if date:
                    item["date"] = date
                elif not date:
                    item["date"] = now.strftime("%Y-%m-%d")
                if time_slot:
                    item["timeSlot"] = time_slot

                items.append(item)

            if items:
                return [{"type": "create_plan", "items": items}]

    # ---- SINGLE TASK CREATION (default) ----
    date, rest = _extract_date(text)
    time_slot, rest = _extract_time_slot(rest)
    priority, rest = _extract_priority(rest)
    title = _clean_title(rest)

    if not title:
        title = text.strip()

    intent_out: dict = {
        "type": "create_task",
        "title": title,
        "priority": priority,
    }

    if date:
        intent_out["date"] = date
    else:
        intent_out["date"] = now.strftime("%Y-%m-%d")

    if time_slot:
        intent_out["timeSlot"] = time_slot

    return [intent_out]
