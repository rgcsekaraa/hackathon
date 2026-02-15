"""
Background worker for lead enrichment and photo analysis jobs.

Run:
    cd apps/api && PYTHONPATH=. python services/workers/lead_worker.py
"""

from __future__ import annotations

import asyncio
import base64
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from db.session import get_db_context
from models.lead import LeadSession
from db.init_db import init_db
from services.jobs.queue import dequeue_job
from services.lead_orchestrator import process_customer_message, process_photo
from services.realtime.connection_manager import lead_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [lead-worker] %(message)s",
)
logger = logging.getLogger("lead-worker")


async def _patch_to_event(patch) -> dict:
    """Convert orchestrator patch to websocket lead_update payload."""
    data = dict(patch.data or {})
    status = str(data.get("status") or "").strip()
    if not status:
        if patch.type == "quote_ready":
            status = "tradie_review"
        elif patch.type == "photo_analysed":
            status = "photo_analysed"
        elif patch.type == "step_changed":
            step = str(data.get("step") or "")
            if step == "classifying":
                status = "details_collected"
            elif step in {"pricing", "distance_calculated"}:
                status = "pricing"
            elif step == "photo_offer":
                status = "media_pending"

    lead = {
        "id": patch.lead_id,
        "status": status,
        "pipeline_step": data.get("step"),
        "pipeline_message": data.get("message") or patch.message,
        **data,
    }
    return {"type": "lead_update", "lead": lead, "message": patch.message}


async def _broadcast_patch(patch) -> None:
    event = await _patch_to_event(patch)
    await lead_manager.broadcast_lead_update(event["lead"])


async def _process_lead_enrichment(job: dict) -> None:
    lead_id = str(job.get("lead_id") or "")
    message = str(job.get("message") or "").strip()
    if not lead_id or not message:
        return

    async with get_db_context() as db:
        result = await db.execute(select(LeadSession).where(LeadSession.id == lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            logger.warning("Lead not found for enrichment job: %s", lead_id)
            return

        await process_customer_message(db, lead, message, on_patch=_broadcast_patch)

        await lead_manager.broadcast_lead_update(
            {
                "id": lead.id,
                "status": lead.status,
                "quote_total": lead.quote_total,
                "distance_km": lead.distance_km,
                "travel_minutes": lead.travel_minutes,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )


async def _process_photo_analysis(job: dict) -> None:
    lead_id = str(job.get("lead_id") or "")
    image_b64 = str(job.get("image_b64") or "")
    if not lead_id or not image_b64:
        return

    try:
        image_bytes = base64.b64decode(image_b64)
    except Exception:
        logger.warning("Invalid base64 image payload for lead: %s", lead_id)
        return

    async with get_db_context() as db:
        result = await db.execute(select(LeadSession).where(LeadSession.id == lead_id))
        lead = result.scalar_one_or_none()
        if not lead:
            logger.warning("Lead not found for photo job: %s", lead_id)
            return

        await process_photo(db, lead, image_bytes=image_bytes, on_patch=_broadcast_patch)

        await lead_manager.broadcast_lead_update(
            {
                "id": lead.id,
                "status": "photo_analysed",
                "photo_analysis": lead.photo_analysis,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )


async def run_worker() -> None:
    await init_db()
    logger.info("Lead worker started")
    while True:
        try:
            job = await dequeue_job(timeout_seconds=5)
            if not job:
                continue

            job_type = str(job.get("type") or "").strip()
            if job_type == "lead_enrichment":
                await _process_lead_enrichment(job)
            elif job_type == "photo_analysis":
                await _process_photo_analysis(job)
            else:
                logger.warning("Unknown job type: %s", job_type)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("Worker loop error: %s", exc)
            await asyncio.sleep(0.5)


if __name__ == "__main__":
    asyncio.run(run_worker())
