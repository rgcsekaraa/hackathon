"""
LiveKit Voice Agent Worker (Tradie Assistant).

This worker handles voice conversations for the Tradie (Sophiie Orbit).
It accepts jobs where participant.identity starts with "user-".

Compatible with livekit-agents >= 1.4.0.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Annotated

from livekit.agents import (
    AutoSubscribe,
    AgentSession,
    JobContext,
    JobProcess,
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
from services.realtime.connection_manager import lead_manager

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

    @llm.function_tool(description="List jobs/appointments for a specific date")
    async def list_jobs(self, date_query: str) -> str:
        """
        List jobs for a specific date (e.g. 'tomorrow', 'next tuesday').
        Triggers a UI update to show the jobs in the chat.
        """
        logger.info("Listing jobs for: %s", date_query)
        
        # In a real app, parse date_query to actual date. 
        # For now, mock some data based on query.
        jobs = [
            {"id": "j1", "title": "Leaking Tap", "client": "John Doe", "time": "09:00 AM", "status": "pending"},
            {"id": "j2", "title": "Hot Water System", "client": "Jane Smith", "time": "11:30 AM", "status": "confirmed"},
            {"id": "j3", "title": "Blocked Drain", "client": "Bob Brown", "time": "02:00 PM", "status": "completed"},
        ]

        # Send UI Patch to render these components
        patch = []
        for i, job in enumerate(jobs):
            patch.append({
                "op": "add",
                "component": {
                    "id": job["id"],
                    "type": "task",
                    "title": job["title"],
                    "description": f"Client: {job['client']}",
                    "priority": "normal",
                    "timeSlot": job["time"],
                    "completed": job["status"] == "completed",
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                    "updatedAt": datetime.now(timezone.utc).isoformat(),
                }
            })
        
        try:
            # Broadcast to the specific tradie's session via API
            import httpx
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{settings.api_url}/api/voice/patch",
                    json={
                        "tradie_id": self.user_id,
                        "operations": patch
                    },
                    timeout=2.0
                )
            return f"I've pulled up {len(jobs)} jobs for {date_query}. You can see them on your screen."
        except Exception as exc:
            logger.error("Failed to push UI patch: %s", exc)
            return f"Found {len(jobs)} jobs, but couldn't update the screen. They are: " + ", ".join([j["title"] for j in jobs])

    @llm.function_tool(description="Send an SMS to a customer")
    async def send_sms(self, to: str, message: str) -> str:
        """
        Send an SMS to a phone number.
        """
        logger.info("Sending SMS to %s: %s", to, message)
        try:
            from services.integrations.sms import send_sms
            await send_sms(to, message)
            return f"SMS sent to {to}."
        except Exception as exc:
            return f"Failed to send SMS: {exc}"

    @llm.function_tool(description="Make an outbound call to a customer")
    async def outbound_call(self, to: str) -> str:
        """
        Trigger an outbound call to a customer.
        """
        logger.info("Initiating outbound call to %s", to)
        return f"Calling {to} now..."

    @llm.function_tool(description="Notify next customer that you are running late")
    async def notify_late(self, minutes: int) -> str:
        """
        Send an SMS to the next customer in the schedule notifying them of a delay.
        """
        logger.info("Notifying next customer of %d min delay", minutes)
        
        # Mock finding next job
        next_job = {"client": "Jane Smith", "phone": "+61400000000", "time": "11:30 AM"}
        
        message = f"Hi {next_job['client']}, I'm running about {minutes} mins late for our {next_job['time']} appointment. Sorry for the delay! - {self.business_name}"
        
        return await self.send_sms(next_job["phone"], message)


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
            tradie_ctx = await load_tradie_context(db, user_id=user_id)
            logger.info("Loaded context for: %s", tradie_ctx.get("business_name"))
    except Exception as exc:
        logger.error("Failed to load tradie context: %s", exc)

    # 4. Build tool controller
    fnc_ctx = TradieAssistantController(tradie_ctx, user_id)
    tools = llm.find_function_tools(fnc_ctx)

    # 5. Build instructions
    instructions = (
        f"You are Sophiie, an intelligent assistant for {tradie_ctx.get('business_name', 'the business')}. "
        "You help the tradie manage jobs, send messages, and make calls. "
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
