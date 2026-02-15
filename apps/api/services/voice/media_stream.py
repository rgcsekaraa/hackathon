"""
Twilio Media Streams handler — real-time bidirectional voice.

This is the main orchestrator that connects:
1. Twilio Media Streams (µ-law 8kHz audio in/out)
2. Deepgram Live (real-time transcription)
3. LangChain (classification + response generation)
4. ElevenLabs Streaming (real-time TTS)
5. WebSocket broadcast (lead push to mobile)

The customer hears AI responses within ~1-2 seconds of finishing a sentence.
"""

import asyncio
import base64
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect

from core.config import settings
from services.voice.deepgram_live import DeepgramLiveClient
from services.voice.tts_stream import stream_tts_to_mulaw
from services.ai.langchain_agent import classify_lead, ClassifiedLead, _fallback_classify
from services.realtime.connection_manager import lead_manager
from services.profile_context import get_profile_context_for_ai as get_tradie_context_for_ai

logger = logging.getLogger(__name__)


class CallSession:
    """
    State management for a single live call.

    Tracks the conversation, accumulates transcripts, manages
    the Deepgram connection, and handles response generation.
    """

    def __init__(self, call_sid: str, stream_sid: str, tradie_ctx: dict):
        self.call_sid = call_sid
        self.stream_sid = stream_sid
        self.lead_id = f"lead-{call_sid[:8]}"
        self.tradie_ctx = tradie_ctx
        self.tradie_ctx_text = get_tradie_context_for_ai(tradie_ctx) if tradie_ctx else ""

        # Transcript accumulation
        self.transcript_buffer = ""
        self.final_transcript = ""
        self.confidence_sum = 0.0
        self.confidence_count = 0

        # State
        self.greeting_sent = False
        self.classified = False
        self.is_speaking = False  # AI is speaking
        self.customer_speaking = False
        self.classification: Optional[ClassifiedLead] = None

        # Conversation history
        self.conversation: list[dict] = []
        self.caller = "unknown"

    @property
    def avg_confidence(self) -> float:
        if self.confidence_count == 0:
            return 0.0
        return self.confidence_sum / self.confidence_count


async def handle_media_stream(
    websocket: WebSocket,
    tradie_ctx: dict,
) -> None:
    """
    Main handler for Twilio Media Streams WebSocket.

    Protocol:
    1. Twilio sends 'connected', 'start', 'media', 'stop' messages
    2. We forward 'media' audio to Deepgram Live
    3. On transcript → classify → generate response → stream audio back
    4. Audio back is sent as 'media' messages to Twilio
    """
    await websocket.accept()

    session = CallSession(
        call_sid="",
        stream_sid="",
        tradie_ctx=tradie_ctx,
    )

    deepgram: Optional[DeepgramLiveClient] = None
    response_queue: asyncio.Queue = asyncio.Queue()

    # -----------------------------------------------------------------------
    # Callbacks for Deepgram
    # -----------------------------------------------------------------------

    async def on_transcript(text: str, confidence: float, is_final: bool):
        """Called when Deepgram produces a transcript."""
        session.customer_speaking = True

        if is_final:
            session.final_transcript += " " + text
            session.final_transcript = session.final_transcript.strip()
            session.confidence_sum += confidence
            session.confidence_count += 1
            logger.info("📝 Final: %s (%.2f)", text, confidence)
        else:
            session.transcript_buffer = text
            logger.debug("📝 Interim: %s", text)

    async def on_utterance_end():
        """Called when customer pauses (1.5s silence) — trigger processing."""
        session.customer_speaking = False

        transcript = session.final_transcript.strip()
        if not transcript or len(transcript) < 5:
            return

        if session.classified:
            # Already classified — could handle follow-up questions here
            return

        logger.info("🎯 Utterance complete: %s", transcript)

        # Process the transcript
        await response_queue.put(("process", transcript))

    # -----------------------------------------------------------------------
    # Response sender — streams TTS audio back to Twilio
    # -----------------------------------------------------------------------

    async def response_sender():
        """Background task: reads from response_queue and sends audio to Twilio."""
        while True:
            try:
                action, data = await asyncio.wait_for(
                    response_queue.get(), timeout=120.0
                )
            except asyncio.TimeoutError:
                break

            if action == "speak":
                await _send_tts_response(websocket, session, data)
            elif action == "process":
                await _process_and_respond(websocket, session, data)
            elif action == "stop":
                break

    # -----------------------------------------------------------------------
    # Main message loop
    # -----------------------------------------------------------------------

    sender_task = asyncio.create_task(response_sender())

    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            event = data.get("event", "")

            if event == "connected":
                logger.info("📞 Twilio Media Stream connected")

            elif event == "start":
                start_data = data.get("start", {})
                session.call_sid = start_data.get("callSid", str(uuid.uuid4()))
                session.stream_sid = start_data.get("streamSid", "")
                session.caller = start_data.get(
                    "customParameters", {}
                ).get("from", "unknown")
                session.lead_id = f"lead-{session.call_sid[:8]}"

                logger.info(
                    "📞 Stream started: call=%s, stream=%s, from=%s",
                    session.call_sid, session.stream_sid, session.caller,
                )

                # Connect to Deepgram Live
                deepgram = DeepgramLiveClient(
                    on_transcript=on_transcript,
                    on_utterance_end=on_utterance_end,
                )
                await deepgram.connect()

                # Send greeting (AI speaks first)
                if not session.greeting_sent:
                    business_name = session.tradie_ctx.get(
                        "business_name", settings.default_business_name
                    )
                    greeting = (
                        f"G'day! Thanks for calling {business_name}. "
                        f"Tell us what's going on with your plumbing, "
                        f"and your address, and we'll sort you out with a quote. "
                        f"Fire away, mate!"
                    )
                    await response_queue.put(("speak", greeting))
                    session.greeting_sent = True

            elif event == "media":
                # Forward audio chunk to Deepgram
                payload = data.get("media", {}).get("payload", "")
                if payload and deepgram:
                    audio_bytes = base64.b64decode(payload)
                    await deepgram.send_audio(audio_bytes)

            elif event == "stop":
                logger.info("📞 Stream stopped: %s", session.call_sid)
                break

    except WebSocketDisconnect:
        logger.info("📞 WebSocket disconnected: %s", session.call_sid)
    except Exception as exc:
        logger.error("📞 Media stream error: %s", exc, exc_info=True)
    finally:
        # Cleanup
        await response_queue.put(("stop", None))
        sender_task.cancel()
        try:
            await sender_task
        except asyncio.CancelledError:
            pass

        if deepgram:
            await deepgram.close()

        # Broadcast final lead if classified
        if session.classification:
            await _broadcast_lead(session)

        logger.info(
            "📞 Call ended: %s (transcript: %d chars, classified: %s)",
            session.call_sid,
            len(session.final_transcript),
            session.classified,
        )


async def _process_and_respond(
    websocket: WebSocket,
    session: CallSession,
    transcript: str,
) -> None:
    """Classify the transcript and respond with TTS."""

    # Low confidence — ask to repeat
    if session.avg_confidence < 0.3 and session.confidence_count > 0:
        response = (
            "Sorry mate, there's a bit of background noise. "
            "Could you say that again a bit louder?"
        )
        await _send_tts_response(websocket, session, response)
        session.final_transcript = ""
        session.confidence_sum = 0.0
        session.confidence_count = 0
        return

    # Classify
    try:
        classified = await classify_lead(
            transcript, context=session.tradie_ctx_text
        )
    except Exception as exc:
        logger.error("Classification failed: %s — using fallback", exc)
        classified = _fallback_classify(transcript)

    session.classification = classified
    session.classified = True

    # Check service area
    service_radius = session.tradie_ctx.get("service_radius_km", 50)
    if classified.suburb and classified.suburb != "unknown":
        base_address = session.tradie_ctx.get("base_address", "")
        business_name = session.tradie_ctx.get("business_name", "our plumber")
        if base_address:
            try:
                from services.integrations.distance import calculate_distance
                dist = await calculate_distance(base_address, classified.suburb)
                if dist.distance_km > service_radius:
                    response = (
                        f"Thanks for calling {business_name}, mate. "
                        f"Unfortunately, {classified.suburb} is outside our service area — "
                        f"we cover about {service_radius:.0f} kilometres from our base. "
                        f"We'd recommend searching for a local plumber in your area. "
                        f"Sorry about that, and best of luck getting it sorted. Cheers!"
                    )
                    await _send_tts_response(websocket, session, response)
                    return
            except Exception:
                pass  # Distance check failed — proceed anyway

    # Build response
    job_display = classified.job_type.replace("_", " ")
    business_name = session.tradie_ctx.get("business_name", "our plumber")

    # Get next available slot
    next_slots = session.tradie_ctx.get("next_available_slots", [])
    slot_text = ""
    if next_slots:
        slot = next_slots[0]
        if slot.get("is_today"):
            slot_text = f"We've actually got a slot available today between {slot['time_slot']}. "
        elif slot.get("is_tomorrow"):
            slot_text = f"Our next available slot is tomorrow between {slot['time_slot']}. "
        else:
            slot_text = f"Our next available slot is {slot['display']}. "

    # Send SMS photo link concurrently
    sms_task = None
    if session.caller != "unknown":
        try:
            from services.integrations.sms import send_photo_upload_link
            sms_task = asyncio.create_task(
                send_photo_upload_link(session.caller, session.lead_id)
            )
        except Exception:
            pass

    response = (
        f"Thanks mate! Sounds like a {job_display} job"
    )
    if classified.suburb and classified.suburb != "unknown":
        response += f" in {classified.suburb}"
    response += f". {slot_text}"
    response += (
        f"A tradie from {business_name} will review your request and "
        f"get back to you with a quote real quick. "
        f"We've also sent you a text with a link to upload any photos of the issue. "
        f"That'll help us nail down an accurate price for you. Cheers!"
    )

    await _send_tts_response(websocket, session, response)

    # Wait for SMS to finish
    if sms_task:
        try:
            await sms_task
        except Exception:
            pass

    # Add to conversation
    session.conversation.append({
        "role": "customer",
        "text": transcript,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    session.conversation.append({
        "role": "assistant",
        "text": response,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


async def _send_tts_response(
    websocket: WebSocket,
    session: CallSession,
    text: str,
) -> None:
    """Stream TTS audio back to Twilio via the WebSocket."""
    session.is_speaking = True

    try:
        # Check if we have ElevenLabs API key for streaming TTS
        if settings.elevenlabs_api_key:
            async for mulaw_chunk in stream_tts_to_mulaw(text):
                # If customer starts speaking, stop AI response (barge-in)
                if session.customer_speaking:
                    logger.info("🔇 Customer interrupted — stopping TTS")
                    break

                # Send audio chunk to Twilio
                audio_b64 = base64.b64encode(mulaw_chunk).decode("ascii")
                media_message = {
                    "event": "media",
                    "streamSid": session.stream_sid,
                    "media": {
                        "payload": audio_b64,
                    },
                }
                await websocket.send_json(media_message)
        else:
            # No TTS available — send a mark so Twilio knows we're done
            logger.warning("No ElevenLabs key — cannot stream TTS")

        # Send mark to signal end of speech
        mark_message = {
            "event": "mark",
            "streamSid": session.stream_sid,
            "mark": {"name": f"response-{uuid.uuid4().hex[:8]}"},
        }
        await websocket.send_json(mark_message)

    except Exception as exc:
        logger.error("TTS streaming failed: %s", exc)
    finally:
        session.is_speaking = False


async def _broadcast_lead(session: CallSession) -> None:
    """Broadcast the classified lead to connected tradie clients."""
    if not session.classification:
        return

    classified = session.classification
    business_name = session.tradie_ctx.get("business_name", "")
    next_slots = session.tradie_ctx.get("next_available_slots", [{}])
    next_slot_display = next_slots[0].get("display", "soon") if next_slots else "soon"

    lead_data = {
        "id": session.lead_id,
        "customerName": session.caller,
        "customerPhone": session.caller,
        "address": classified.address,
        "suburb": classified.suburb,
        "urgency": classified.urgency,
        "status": "new",
        "jobType": classified.job_type,
        "description": classified.description,
        "partsNeeded": classified.parts_needed,
        "transcript": session.final_transcript,
        "transcriptConfidence": session.avg_confidence,
        "tradieId": session.tradie_ctx.get("tradie_id"),
        "businessName": business_name,
        "nextAvailableSlot": next_slot_display,
        "conversationType": "realtime",  # Flag: this was a live conversation
        "photoUrls": [],
        "quoteLines": [],
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    try:
        await lead_manager.broadcast_new_lead(lead_data)
        logger.info("📱 Lead broadcast: %s (%s)", session.lead_id, classified.job_type)
    except Exception as exc:
        logger.error("Lead broadcast failed: %s", exc)
