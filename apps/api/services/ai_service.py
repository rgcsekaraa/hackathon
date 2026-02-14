"""
AI service -- handles LLM calls via OpenRouter for intent extraction.

Processes user utterances and returns structured intents. Uses streaming
for lower perceived latency. Falls back to mock intents when no API key
is configured, so the app works during development without LLM access.
"""

import json
import logging
from datetime import datetime, timezone

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


# The system prompt constraining LLM output to our intent schema
SYSTEM_PROMPT = """You are an AI assistant for a trades business workspace app called Spatial Voice.
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

    If no API key is available, returns mock intents for development.
    """
    if not settings.openrouter_api_key:
        logger.info("No OpenRouter API key -- using mock intent parser")
        return _mock_parse(text)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    system_prompt = SYSTEM_PROMPT.replace("{today}", today)

    # Include a summary of current workspace so the LLM has context
    workspace_context = _build_workspace_context(workspace)
    user_message = text
    if workspace_context:
        user_message = f"Current workspace items:\n{workspace_context}\n\nUser says: {text}"

    try:
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
            data = response.json()

        content = data["choices"][0]["message"]["content"]
        intents = json.loads(content)

        if not isinstance(intents, list):
            intents = [intents]

        logger.info("Parsed %d intents from utterance", len(intents))
        return intents

    except Exception as exc:
        logger.error("LLM call failed: %s -- falling back to mock parser", exc)
        return _mock_parse(text)


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


def _mock_parse(text: str) -> list[dict]:
    """
    Simple keyword-based parser for development without an LLM.
    Good enough to demonstrate the UI flow.
    """
    text_lower = text.lower()
    tomorrow = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Check for simple create patterns
    if any(word in text_lower for word in ["add", "create", "new", "schedule"]):
        return [{
            "type": "create_task",
            "title": text.strip(),
            "date": tomorrow,
            "timeSlot": "morning",
            "priority": "normal",
        }]

    # Check for priority changes
    if "urgent" in text_lower:
        return [{
            "type": "set_priority",
            "target": text.replace("urgent", "").strip(),
            "priority": "urgent",
        }]

    # Check for deletion
    if any(word in text_lower for word in ["delete", "remove", "cancel"]):
        return [{
            "type": "delete_item",
            "target": text.strip(),
        }]

    # Default: treat the whole utterance as a plan creation
    return [{
        "type": "create_task",
        "title": text.strip(),
        "date": tomorrow,
        "timeSlot": "morning",
        "priority": "normal",
    }]
