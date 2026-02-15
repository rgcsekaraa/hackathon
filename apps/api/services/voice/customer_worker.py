"""
LiveKit Voice Agent Worker (Customer Receptionist).

This worker handles inbound customer calls (non-tradie identity).
It acts as a virtual receptionist: greeting the caller, collecting
job details, checking the service area, and logging the lead.

Compatible with livekit-agents >= 1.4.0.

Usage:
    python apps/api/services/voice/customer_worker.py dev
"""

import logging
from datetime import datetime, timezone
from sqlalchemy import select

from livekit.agents import (
    AutoSubscribe,
    AgentSession,
    JobContext,
    JobRequest,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice import Agent
from livekit.plugins import deepgram, elevenlabs, openai, silero

from core.config import settings
from db.session import get_db_context
from services.profile_context import (
    load_profile_context as load_tradie_context,
    get_profile_context_for_ai as get_tradie_context_for_ai,
)
from services.integrations.distance import calculate_distance
from services.realtime.connection_manager import lead_manager
from services.lead_orchestrator import create_lead, process_customer_message
from schemas.lead import LeadCreate, UrgencyEnum
from models.lead import UserProfile

logger = logging.getLogger("customer-worker")
logger.setLevel(logging.INFO)


class TradieController:
    """
    Exposes tradie business logic to the LLM as callable tools.
    Allows the AI to check service areas, availability, and log leads.
    """

    def __init__(self, tradie_ctx: dict, lead_id: str, caller_identity: str):
        self.tradie_ctx = tradie_ctx
        self.lead_id = lead_id
        self.caller_identity = caller_identity
        self.business_name = tradie_ctx.get("business_name", "our plumber")
        self.tradie_id = tradie_ctx.get("tradie_id")
        self.user_profile_id = tradie_ctx.get("user_profile_id")

    @llm.function_tool(description="Check if a suburb is within our service area")
    async def check_service_area(self, suburb: str) -> str:
        """
        Check if the given suburb is within the service radius.

        Args:
            suburb: The suburb name to check.
        """
        base_address = self.tradie_ctx.get("base_address")
        radius = self.tradie_ctx.get("service_radius_km", 30)

        logger.info("Checking service area: %s (base: %s, radius: %s)", suburb, base_address, radius)

        if not base_address:
            return "Service area check unavailable, assume we service it."

        try:
            dist = await calculate_distance(base_address, suburb)
            if dist.distance_km > radius:
                return (
                    f"Unfortunately, {suburb} is {dist.distance_km:.1f}km away, which is outside our "
                    f"{radius}km service area. Politely decline the job and recommend a local plumber."
                )
            return f"{suburb} is within our service area ({dist.distance_km:.1f}km away). Proceed with the booking."
        except Exception as exc:
            logger.error("Distance check failed: %s", exc)
            return "Could not verify distance, proceed with caution."

    @llm.function_tool(description="Get the next available appointment slots")
    def get_next_availability(self) -> str:
        """
        Get the next available appointment slots from the calendar.
        """
        slots = self.tradie_ctx.get("next_available_slots", [])
        if not slots:
            return "We have no available slots in the next 2 weeks."

        text = f"Here are the next available slots for {self.business_name}:\n"
        for slot in slots[:3]:
            if slot.get("is_today"):
                text += f"- Today between {slot['time_slot']}\n"
            elif slot.get("is_tomorrow"):
                text += f"- Tomorrow between {slot['time_slot']}\n"
            else:
                text += f"- {slot['display']}\n"
        return text

    @llm.function_tool(description="Run estimator handoff: persist lead, analyse issue, calculate quote, and push to tradie portal")
    async def handoff_to_estimator(
        self,
        customer_name: str,
        customer_phone: str,
        job_description: str,
        address: str,
        urgency: str = "today",
    ) -> str:
        """
        Multi-agent handoff from receptionist -> estimator.
        This writes the lead to DB, runs enrichment + pricing, and pushes it live.

        Args:
            customer_name: Customer's name.
            customer_phone: Customer phone number.
            job_description: Summary of the plumbing issue.
            address: Property address.
            urgency: emergency/today/tomorrow/this_week/flexible.
        """
        urgency_value = urgency if urgency in {e.value for e in UrgencyEnum} else UrgencyEnum.FLEXIBLE.value
        try:
            async with get_db_context() as db:
                profile = None
                if self.user_profile_id:
                    result = await db.execute(select(UserProfile).where(UserProfile.id == self.user_profile_id))
                    profile = result.scalar_one_or_none()
                if not profile:
                    result = await db.execute(select(UserProfile).limit(1))
                    profile = result.scalar_one_or_none()
                if not profile:
                    return "No active tradie profile found. I can't create this lead yet."

                lead_payload = LeadCreate(
                    customer_name=customer_name,
                    customer_phone=customer_phone or self.caller_identity,
                    customer_address=address,
                    job_description=job_description,
                    urgency=UrgencyEnum(urgency_value),
                )
                lead = await create_lead(db, profile.id, lead_payload)
                await process_customer_message(db, lead, job_description)
                await db.commit()
                await db.refresh(lead)

                realtime_lead = {
                    "id": lead.id,
                    "customerName": lead.customer_name,
                    "customerPhone": lead.customer_phone,
                    "address": lead.customer_address,
                    "urgency": lead.urgency,
                    "status": lead.status,
                    "jobType": lead.job_type,
                    "description": lead.job_description,
                    "quoteTotal": lead.quote_total,
                    "businessName": self.business_name,
                    "createdAt": lead.created_at.isoformat() if lead.created_at else datetime.now(timezone.utc).isoformat(),
                }
                await lead_manager.broadcast_new_lead(realtime_lead)

            quote_text = f"${lead.quote_total:.2f}" if lead.quote_total else "pending"
            return f"Handoff complete. Lead {lead.id} is ready with estimate {quote_text}."
        except Exception as exc:
            logger.error("Estimator handoff failed: %s", exc, exc_info=True)
            return f"I couldn't complete estimator handoff due to an internal error: {exc}"

    @llm.function_tool(description="Notify tradie copilot with a concise lead summary")
    async def handoff_to_tradie_copilot(self, lead_id: str, summary: str) -> str:
        """Push a short note to tradie copilot UI for immediate follow-up."""
        if not self.tradie_id:
            return "Tradie copilot handoff skipped: tradie identity unavailable."
        try:
            operations = [{
                "op": "add",
                "component": {
                    "id": f"handoff-{lead_id}",
                    "type": "note",
                    "title": f"Lead Handoff {lead_id[:8]}",
                    "description": summary,
                    "priority": "high",
                    "completed": False,
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                },
            }]
            await lead_manager.send_to_tradie(self.tradie_id, {"type": "patch", "operations": operations})
            return f"Tradie copilot notified for lead {lead_id}."
        except Exception as exc:
            logger.error("Tradie copilot handoff failed: %s", exc)
            return f"Could not notify tradie copilot: {exc}"

    @llm.function_tool(description="Legacy alias for estimator handoff")
    async def log_lead_details(self, customer_name: str, job_description: str, address: str) -> str:
        """Backward compatible alias routed to handoff_to_estimator."""
        return await self.handoff_to_estimator(
            customer_name=customer_name,
            customer_phone=self.caller_identity,
            job_description=job_description,
            address=address,
            urgency="today",
        )


async def entrypoint(ctx: JobContext):
    """
    Main agent entrypoint for customer (inbound) calls.
    Called when a new job (room connection) is assigned.
    """
    # 1. Connect to LiveKit Room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 2. Wait for participant
    participant = await ctx.wait_for_participant()
    caller_identity = participant.identity
    lead_id = f"lead-{ctx.room.name}"

    logger.info("Customer call started: %s (room: %s)", caller_identity, ctx.room.name)

    # 3. Load tradie context from DB
    tradie_ctx = {}
    try:
        async with get_db_context() as db:
            tradie_ctx = await load_tradie_context(db)
            logger.info("Loaded context for: %s", tradie_ctx.get("business_name"))
    except Exception as exc:
        logger.error("Failed to load tradie context: %s", exc)

    # 4. Build tool controller
    fnc_ctx = TradieController(tradie_ctx, lead_id, caller_identity)
    tools = llm.find_function_tools(fnc_ctx)

    # 5. Build instructions
    context_text = get_tradie_context_for_ai(tradie_ctx)
    business_name = tradie_ctx.get("business_name", settings.default_business_name)
    instructions = (
        f"{context_text}\n\n"
        "You are a friendly, professional receptionist for this plumbing business. "
        "Your goal is to collect the customer's name, phone, address, urgency, and issue details. "
        "Use the tools provided to check service area and availability. "
        "After intake is complete, call handoff_to_estimator exactly once. "
        "Then call handoff_to_tradie_copilot with a one-sentence summary. "
        "Prioritize short, low-latency responses and avoid long explanations. "
        "Keep responses concise and conversational (Australian accent). "
        "Start by introducing yourself and the business."
    )

    # 6. Create Agent (new API)
    agent = Agent(
        instructions=instructions,
        tools=tools,
    )

    # 7. Create and start session
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-2-general",
            language="en-AU",
            smart_format=True,
        ),
        tts=elevenlabs.TTS(
            voice=elevenlabs.Voice(
                id=settings.elevenlabs_voice_id or "XB0fDUnXU5powFXDhCwa",
                name="Charlotte",
                category="premade",
                settings=elevenlabs.VoiceSettings(
                    stability=0.5,
                    similarity_boost=0.8,
                    style=0.25,
                    use_speaker_boost=True
                ),
            ),
            model="eleven_turbo_v2",
            api_key=settings.elevenlabs_api_key,
        ),
        llm=openai.LLM(
            model=settings.openrouter_model,
            base_url=settings.openrouter_base_url,
            api_key=settings.openrouter_api_key,
        ),
        vad=silero.VAD.load(),
        allow_interruptions=True,
    )

    session.start(agent, room=ctx.room)

    # 8. Send initial greeting
    greeting = f"G'day! Thanks for calling {business_name}. How can I help you today?"
    await session.say(greeting)

    # 9. Report call status
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.api_url}/api/voice/event",
                json={
                    "type": "call_status",
                    "status": "started",
                    "caller": caller_identity,
                    "lead_id": lead_id,
                },
                timeout=2.0
            )
    except Exception as exc:
        logger.warning("Failed to report call start: %s", exc)


async def _report_call_ended(lead_id: str, caller: str):
    """Report call ended via internal API."""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.api_url}/api/voice/event",
                json={
                    "type": "call_status",
                    "status": "ended",
                    "caller": caller,
                    "lead_id": lead_id,
                },
                timeout=2.0
            )
    except Exception as exc:
        logger.warning("Failed to report call end: %s", exc)


async def request_fnc(req: JobRequest):
    """Accept only non-tradie jobs (inbound customer calls)."""
    if req.publisher and req.publisher.identity.startswith("user-"):
        # Ignore Tradie calls (let tradie_worker handle them)
        await req.reject()
        return
    await req.accept()


if __name__ == "__main__":
    # Run the worker with request filter
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        request_fnc=request_fnc,
    ))
