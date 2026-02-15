"""
LiveKit Voice Agent Worker.

This is a standalone worker process that manages real-time voice conversations
using the LiveKit Agents Framework.

Pipeline:
1.  **STT**: Deepgram (Nova-2, en-AU, plumbing keywords)
2.  **LLM**: OpenRouter (Llama 3.1 70B) with function calling
3.  **TTS**: ElevenLabs (Australian accent)
4.  **Context**: Loads tradie business details from DB (rates, schedule, area)

Usage:
    python apps/api/services/voice/livekit_agent.py dev
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Annotated

from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.voice import Agent as VoicePipelineAgent
from livekit.plugins import deepgram, elevenlabs, openai, silero

from core.config import settings
from db.session import get_db_context
from services.profile_context import load_profile_context as load_tradie_context, get_profile_context_for_ai as get_tradie_context_for_ai
from services.integrations.distance import calculate_distance
from services.realtime.connection_manager import lead_manager

logger = logging.getLogger("livekit-agent")
logger.setLevel(logging.INFO)


class TradieController:
    """
    Exposes tradie business logic to the LLM as callable tools.
    Allows the AI to check service areas, availability, and log leads.
    """

    def __init__(self, tradie_ctx: dict, lead_id: str):
        self.tradie_ctx = tradie_ctx
        self.lead_id = lead_id
        self.business_name = tradie_ctx.get("business_name", "our plumber")

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

        # Format slots specifically for the AI to speak naturally
        text = f"Here are the next available slots for {self.business_name}:\n"
        for slot in slots[:3]:
            if slot.get("is_today"):
                text += f"- Today between {slot['time_slot']}\n"
            elif slot.get("is_tomorrow"):
                text += f"- Tomorrow between {slot['time_slot']}\n"
            else:
                text += f"- {slot['display']}\n"
        return text

    @llm.function_tool(description="Log the customer's job details and contact info")
    async def log_lead_details(
        self,
        customer_name: str,
        job_description: str,
        address: str,
    ) -> str:
        """
        Log the lead details to the system.

        Args:
            customer_name: Customer's name.
            job_description: Summary of the plumbing issue.
            address: Property address.
        """
        logger.info("Logging lead: %s, %s", customer_name, job_description)
        
        # Broadcast to mobile app via WebSocket
        lead_data = {
            "id": self.lead_id,
            "customerName": customer_name,
            "address": address,
            "description": job_description,
            "status": "new",
            "businessName": self.business_name,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "transcript": "Live voice call in progress...",
        }
        
        try:
            await lead_manager.broadcast_new_lead(lead_data)
            return "Lead details logged and sent to the tradie's app."
        except Exception as exc:
            logger.error("Failed to broadcast lead: %s", exc)
            return "Lead logged locally (broadcast failed)."


async def entrypoint(ctx: JobContext):
    """
    Main agent entrypoint.
    Called when a new job (room connection) is assigned.
    """
    # 1. Initialize DB and load Tradie Context
    # We infer tradie_id from room metadata or default to first
    tradie_ctx = {}
    lead_id = f"lead-{ctx.room.name}"
    
    logger.info("Starting agent for room: %s", ctx.room.name)
    
    try:
        async with get_db_context() as db:
            tradie_ctx = await load_tradie_context(db)
            logger.info("Loaded context for: %s", tradie_ctx.get("business_name"))
    except Exception as exc:
        logger.error("Failed to load tradie context: %s", exc)

    # 2. Connect to LiveKit Room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # 3. Initialize Plugins
    # STT: Deepgram Nova-2 (Australian tuned)
    stt = deepgram.STT(
        model="nova-2-general",
        language="en-AU",
        smart_format=True,
    )

    # TTS: ElevenLabs (Australian accent)
    tts = elevenlabs.TTS(
        voice=elevenlabs.Voice(
            id=settings.elevenlabs_voice_id or "XB0fDUnXU5powFXDhCwa", # Charlotte (warm female)
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
    )

    # LLM: OpenRouter (Llama 3.1 70B)
    # Allows for fast, high-quality reasoning with tool calling
    llm_plugin = openai.LLM(
        model=settings.openrouter_model,
        base_url=settings.openrouter_base_url,
        api_key=settings.openrouter_api_key,
    )

    # 4. Context & Logic
    fnc_ctx = TradieController(tradie_ctx, lead_id)
    tools = llm.find_function_tools(fnc_ctx)
    
    # Prepare system prompt from tradie context
    context_text = get_tradie_context_for_ai(tradie_ctx)
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            f"{context_text}\n\n"
            "You are a friendly, professional receptionist for this plumbing business. "
            "Your goal is to collect the customer's name, address, and issue details. "
            "Use the tools provided to check service area and availability. "
            "Keep responses concise and conversational (Australian accent). "
            "Start by introducing yourself and the business."
        ),
    )

    # 5. Create Voice Pipeline Agent
    agent = VoicePipelineAgent(
        vad=silero.VAD.load(),
        stt=stt,
        llm=llm_plugin,
        tts=tts,
        chat_ctx=initial_ctx,
        tools=tools,
        allow_interruptions=True,
    )

    # 6. Start Agent
    agent.start(ctx.room, participant=ctx.job.participant)

    # Send initial greeting
    greeting = f"G'day! Thanks for calling {tradie_ctx.get('business_name', settings.default_business_name)}. How can I help you today?"
    await agent.say(greeting, allow_interruptions=True)


if __name__ == "__main__":
    # Run the worker
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
