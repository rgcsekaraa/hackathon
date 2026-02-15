"""
LiveKit Voice Agent Worker (Tradie Assistant).

This worker handles voice conversations for the Tradie (Sophiie Orbit).
It accepts jobs where participant.identity starts with "user-".

Compatible with livekit-agents >= 1.4.0.
"""

import logging
from datetime import datetime, timezone, timedelta
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
from services.profile_context import load_profile_context as load_tradie_context
from models.lead import LeadSession, UserProfile

logger = logging.getLogger("tradie-worker")
logger.setLevel(logging.INFO)


class TradieAssistantController:
    """
    Assistant for the Tradie (Sophiie Orbit).
    Allows querying jobs, sending SMS, and managing the business.
    """
    def __init__(self, tradie_ctx: dict, user_id: str):
        self.tradie_ctx = tradie_ctx
        self.user_id = user_id
        self.business_name = tradie_ctx.get("business_name", "your business")
        self.user_profile_id = tradie_ctx.get("user_profile_id")

    @staticmethod
    def _resolve_date_query(date_query: str) -> tuple[str, str]:
        """Resolve simple natural language date query to YYYY-MM-DD."""
        now = datetime.now(timezone.utc)
        q = date_query.lower().strip()
        if "tomorrow" in q:
            d = now + timedelta(days=1)
            return d.date().isoformat(), "tomorrow"
        if "today" in q:
            return now.date().isoformat(), "today"
        weekdays = {
            "monday": 0, "tuesday": 1, "wednesday": 2,
            "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
        }
        for name, idx in weekdays.items():
            if name in q:
                days_ahead = (idx - now.weekday()) % 7
                if days_ahead == 0:
                    days_ahead = 7
                d = now + timedelta(days=days_ahead)
                return d.date().isoformat(), name
        return now.date().isoformat(), "today"

    @llm.function_tool(description="List jobs/appointments for a specific date")
    async def list_jobs(self, date_query: str) -> str:
        """
        List jobs for a specific date (e.g. 'tomorrow', 'next tuesday').
        Triggers a UI update to show the jobs in the chat.
        """
        logger.info("Listing jobs for: %s", date_query)
        target_date, date_label = self._resolve_date_query(date_query)
        jobs: list[LeadSession] = []

        try:
            async with get_db_context() as db:
                profile_id = self.user_profile_id
                if not profile_id:
                    result = await db.execute(select(UserProfile.id).where(UserProfile.user_id == self.user_id).limit(1))
                    profile_id = result.scalar_one_or_none()
                if not profile_id:
                    return "I couldn't find your business profile yet."

                result = await db.execute(
                    select(LeadSession)
                    .where(LeadSession.user_profile_id == profile_id)
                    .where((LeadSession.booked_date == target_date) | (LeadSession.booked_date.is_(None)))
                    .order_by(LeadSession.created_at.desc())
                    .limit(15)
                )
                jobs = result.scalars().all()

            operations = []
            now_iso = datetime.now(timezone.utc).isoformat()
            for lead in jobs:
                operations.append({
                    "op": "add",
                    "component": {
                        "id": f"lead-{lead.id}",
                        "type": "task",
                        "title": lead.job_type or "General Job",
                        "description": f"{lead.customer_name} | {lead.customer_address or 'Address pending'} | status: {lead.status}",
                        "priority": "urgent" if lead.urgency == "emergency" else "normal",
                        "date": lead.booked_date or target_date,
                        "timeSlot": lead.booked_time_slot or "afternoon",
                        "completed": lead.status in {"booked", "confirmed"},
                        "createdAt": now_iso,
                        "updatedAt": now_iso,
                    },
                })

            if operations:
                import httpx
                async with httpx.AsyncClient() as client:
                    await client.post(
                        f"{settings.api_url}/api/voice/patch",
                        json={"tradie_id": self.user_id, "operations": operations},
                        timeout=2.0,
                    )

            return f"I found {len(jobs)} jobs for {date_label} and pushed them to your dashboard."
        except Exception as exc:
            logger.error("Failed to list jobs from DB: %s", exc, exc_info=True)
            return f"I couldn't fetch jobs right now due to an internal error: {exc}"

    @llm.function_tool(description="Send an SMS to a customer")
    async def send_sms(self, to: str, message: str) -> str:
        """
        Send an SMS to a phone number.
        """
        logger.info("Sending SMS to %s: %s", to, message)
        try:
            from services.integrations.sms import send_sms
            result = await send_sms(to, message)
            if result.get("status") == "sent":
                return f"SMS sent to {to}."
            return f"SMS failed for {to}: {result.get('error', 'provider rejected request')}"
        except Exception as exc:
            return f"Failed to send SMS: {exc}"

    @llm.function_tool(description="Make an outbound call to a customer")
    async def outbound_call(self, to: str) -> str:
        """
        Trigger an outbound call to a customer.
        """
        logger.info("Initiating outbound call to %s", to)
        try:
            if not settings.twilio_account_sid or not settings.twilio_auth_token or not settings.twilio_phone_number:
                return "Outbound calling is not configured yet."

            tradie_phone = self.tradie_ctx.get("inbound_config", {}).get("forward_to") or self.tradie_ctx.get("inbound_config", {}).get("identifier")
            if not tradie_phone:
                return "Tradie forwarding number is not configured in inbound setup."

            import httpx
            auth = (settings.twilio_account_sid, settings.twilio_auth_token)
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/Calls.json"
            twiml = f"""
            <Response>
                <Say voice="Polly.Nicole" language="en-AU">Connecting you to your customer.</Say>
                <Dial callerId="{settings.twilio_phone_number}">{to}</Dial>
            </Response>
            """
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    url,
                    auth=auth,
                    data={"From": settings.twilio_phone_number, "To": tradie_phone, "Twiml": twiml},
                    timeout=10.0,
                )
                if resp.status_code >= 400:
                    return f"Call initiation failed: {resp.text}"
            return f"Calling {to} now."
        except Exception as exc:
            return f"Failed to initiate outbound call: {exc}"

    @llm.function_tool(description="Notify next customer that you are running late")
    async def notify_late(self, minutes: int) -> str:
        """
        Send an SMS to the next customer in the schedule notifying them of a delay.
        """
        logger.info("Notifying next customer of %d min delay", minutes)
        try:
            async with get_db_context() as db:
                profile_id = self.user_profile_id
                if not profile_id:
                    result = await db.execute(select(UserProfile.id).where(UserProfile.user_id == self.user_id).limit(1))
                    profile_id = result.scalar_one_or_none()
                if not profile_id:
                    return "I couldn't find your profile to identify the next customer."

                result = await db.execute(
                    select(LeadSession)
                    .where(LeadSession.user_profile_id == profile_id)
                    .where(LeadSession.status.in_(["confirmed", "booked", "tradie_review"]))
                    .order_by(LeadSession.booked_date.asc().nullslast(), LeadSession.created_at.asc())
                    .limit(1)
                )
                next_job = result.scalar_one_or_none()
                if not next_job or not next_job.customer_phone:
                    return "No upcoming customer with a valid phone number was found."

                slot = next_job.booked_time_slot or "scheduled slot"
                message = (
                    f"Hi {next_job.customer_name or 'there'}, I'm running about {minutes} mins late for "
                    f"our {slot} appointment. Sorry for the delay. - {self.business_name}"
                )
                return await self.send_sms(next_job.customer_phone, message)
        except Exception as exc:
            logger.error("notify_late failed: %s", exc, exc_info=True)
            return f"I couldn't notify the next customer due to an internal error: {exc}"


async def entrypoint(ctx: JobContext):
    """
    Main agent entrypoint.
    Called when a new job (room connection) is assigned.
    """
    # 1. Connect to LiveKit Room first
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 2. Wait for the participant to join
    participant = await ctx.wait_for_participant()
    identity = participant.identity
    
    if not identity.startswith("user-"):
        logger.warning("Tradie worker received non-tradie job: %s", identity)
        return

    user_id = identity.replace("user-", "")
    logger.info("Starting Tradie Assistant for: %s", user_id)

    # 3. Load tradie context from DB
    tradie_ctx = {}
    try:
        async with get_db_context() as db:
            result = await db.execute(
                select(UserProfile.id).where(UserProfile.user_id == user_id).limit(1)
            )
            profile_id = result.scalar_one_or_none()
            tradie_ctx = await load_tradie_context(db, user_profile_id=profile_id)
            logger.info("Loaded context for: %s", tradie_ctx.get("business_name"))
    except Exception as exc:
        logger.error("Failed to load tradie context: %s", exc)

    # 4. Build tool controller
    fnc_ctx = TradieAssistantController(tradie_ctx, user_id)
    tools = llm.find_function_tools(fnc_ctx)

    # 5. Build instructions
    instructions = (
        f"You are Sophiie, an intelligent assistant for {tradie_ctx.get('business_name', 'the business')}. "
        "You are the tradie copilot stage in a multi-agent pipeline. "
        "You help the tradie manage jobs, send messages, and make calls with near-real-time responses. "
        "You can control the dashboard UI to show information. "
        "Keep responses concise, professional, and helpful (Australian accent). "
        "When asked to show jobs, use the list_jobs tool. "
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
    await session.say("G'day! I'm ready to help. What do you need?")

    # 9. Report call status
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.api_url}/api/voice/event",
                json={
                    "type": "call_status",
                    "status": "started",
                    "caller": identity,
                    "lead_id": f"assistant-{user_id}",
                    "tradie_id": user_id,
                },
                timeout=2.0
            )
    except Exception as exc:
        logger.warning("Failed to report call start: %s", exc)


async def request_fnc(req: JobRequest):
    if not req.publisher or not req.publisher.identity.startswith("user-"):
        # Ignore Customer calls (let customer_worker handle them)
        await req.reject()
        return
    await req.accept()


if __name__ == "__main__":
    # Run the worker with request filter
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        request_fnc=request_fnc,
    ))
