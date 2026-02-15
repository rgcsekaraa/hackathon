"""
Voice API router — Inbound call handling, transcription, TTS, and photo pipeline.

Supports two modes:
1. Real-time (preferred): Twilio Media Streams + Deepgram Live + ElevenLabs Streaming
2. Fallback: Record-and-callback webhook

Production-hardened with edge case handling, retry logic, file validation,
proper TwiML flow, and Redis caching.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, File, UploadFile, Form, Request, HTTPException, WebSocket, Depends
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select

from services.voice.deepgram_stt import transcribe_audio, transcribe_url
from services.voice.elevenlabs_tts import generate_speech, list_voices
from services.ai.langchain_agent import classify_lead, ClassifiedLead
from services.realtime.connection_manager import lead_manager
from services.profile_context import load_profile_context, get_profile_context_for_ai
from db.session import get_db_context
from core.deps import get_current_user
from models.user import User
from models.lead import LeadSession, UserProfile, LeadStatus
from services.voice.livekit_rooms import generate_participant_token

from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Max upload sizes
MAX_AUDIO_SIZE = 25 * 1024 * 1024   # 25 MB
MAX_PHOTO_SIZE = 10 * 1024 * 1024   # 10 MB
ALLOWED_AUDIO_TYPES = {"audio/wav", "audio/mpeg", "audio/mp3", "audio/ogg", "audio/webm", "audio/x-wav", "audio/mp4"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TranscribeResponse(BaseModel):
    transcript: str
    confidence: float
    duration_seconds: float
    classification: dict | None = None
    error: str | None = None


class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = None


class VoiceTokenRequest(BaseModel):
    mode: str = "tradie_copilot"  # tradie_copilot | receptionist


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _safe_classify(text: str, tradie_context: str = "") -> ClassifiedLead:
    """Classify with retry on failure. Injects tradie context into prompt."""
    for attempt in range(2):
        try:
            return await classify_lead(text, context=tradie_context)
        except Exception as exc:
            logger.warning("Classification attempt %d failed: %s", attempt + 1, exc)
            if attempt == 1:
                # Final fallback — use keyword classifier directly
                from services.ai.langchain_agent import _fallback_classify
                return _fallback_classify(text)
    # Should never reach here, but just in case
    from services.ai.langchain_agent import _fallback_classify
    return _fallback_classify(text)


async def _safe_transcribe(recording_url: str) -> dict:
    """Transcribe with retry on transient failures."""
    for attempt in range(2):
        try:
            result = await transcribe_url(recording_url)
            if result.get("transcript"):
                return result
            if attempt == 0:
                # Wait briefly and retry — recording may not be ready yet
                await asyncio.sleep(1.0)
        except Exception as exc:
            logger.warning("Transcription attempt %d failed: %s", attempt + 1, exc)
            if attempt == 0:
                await asyncio.sleep(1.0)
    return {"transcript": "", "confidence": 0.0, "words": [], "duration_seconds": 0.0}


async def _send_photo_sms(phone: str, lead_id: str) -> dict:
    """Send SMS with photo upload link. Never raises — logs and returns status."""
    try:
        from services.integrations.sms import send_sms
        upload_url = f"{settings.frontend_url}/customer?lead={lead_id}"
        body = (
            f"Thanks for calling! Upload photos of the issue here "
            f"for a more accurate quote: {upload_url}"
        )
        return await send_sms(phone, body)
    except Exception as exc:
        logger.error("Failed to send photo SMS to %s: %s", phone, exc)
        return {"status": "error", "error": str(exc)}


async def _cache_lead(lead_id: str, lead_data: dict) -> None:
    """Cache lead data in Redis. Never raises."""
    try:
        from services.lead_cache import cache_lead
        await cache_lead(lead_id, lead_data)
    except Exception as exc:
        logger.warning("Failed to cache lead %s: %s", lead_id, exc)


async def _persist_voice_lead(lead_data: dict) -> None:
    """
    Persist inbound voice lead so it appears in both customer/admin portals.
    """
    profile_id = lead_data.get("userProfileId")
    if not profile_id:
        logger.warning("Skipping lead persistence; no user profile id for lead %s", lead_data.get("id"))
        return

    async with get_db_context() as db:
        profile_result = await db.execute(select(UserProfile).where(UserProfile.id == profile_id))
        if not profile_result.scalar_one_or_none():
            logger.warning("Skipping lead persistence; unknown profile id %s", profile_id)
            return

        existing = await db.execute(select(LeadSession).where(LeadSession.id == lead_data["id"]))
        if existing.scalar_one_or_none():
            return

        lead = LeadSession(
            id=lead_data["id"],
            user_profile_id=profile_id,
            status=LeadStatus.NEW.value,
            customer_name=lead_data.get("customerName", ""),
            customer_phone=lead_data.get("customerPhone", ""),
            customer_address=lead_data.get("address", ""),
            job_type=lead_data.get("jobType", ""),
            job_description=lead_data.get("description", ""),
            urgency=lead_data.get("urgency", "flexible"),
            quote_total=lead_data.get("quoteTotal"),
            conversation=[
                {
                    "role": "customer",
                    "text": lead_data.get("transcript", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ],
        )
        db.add(lead)
        await db.commit()


# ---------------------------------------------------------------------------
# Real-Time Voice Endpoints (Twilio Media Streams)
# ---------------------------------------------------------------------------

@router.post("/voice/incoming")
async def incoming_call(request: Request):
    """
    Twilio calls this when a call arrives.

    Returns TwiML that opens a Media Stream WebSocket for real-time
    bidirectional audio (instead of the old record-and-callback model).
    """
    form = await request.form()
    caller = form.get("From", "unknown")
    called = form.get("To", "unknown")
    call_sid = form.get("CallSid", "unknown")

    logger.info("📞 Incoming call: %s → %s (SID: %s)", caller, called, call_sid)

    # Determine our WebSocket URL dynamically
    host = request.headers.get("host", "localhost:8000")
    scheme = "wss" if request.url.scheme == "https" else "ws"
    ws_url = f"{scheme}://{host}/api/voice/media-stream"

    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{ws_url}">
            <Parameter name="from" value="{caller}" />
            <Parameter name="to" value="{called}" />
        </Stream>
    </Connect>
</Response>"""

    return Response(content=xml, media_type="application/xml")


@router.websocket("/voice/media-stream")
async def media_stream_endpoint(websocket: WebSocket):
    """
    Real-time bidirectional audio via Twilio Media Streams.

    Flow:
    1. Twilio opens this WebSocket when a call connects
    2. Audio chunks stream in from the customer (µ-law 8kHz)
    3. We forward them to Deepgram Live for real-time transcription
    4. On sentence completion → classify with LangChain
    5. Generate TTS response with ElevenLabs streaming
    6. Stream audio back to customer through Twilio
    """
    from services.voice.media_stream import handle_media_stream

    # Pre-load tradie context
    tradie_ctx = {}
    try:
        async with get_db_context() as db:
            tradie_ctx = await load_profile_context(db) or {}
    except Exception as exc:
        logger.warning("Failed to load tradie context for media stream: %s", exc)

    await handle_media_stream(websocket, tradie_ctx)


# ---------------------------------------------------------------------------
# Endpoints (Batch Mode — Fallback)
# ---------------------------------------------------------------------------

@router.post("/voice/transcribe", response_model=TranscribeResponse)
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    classify: bool = Form(default=True),
):
    """
    Transcribe an uploaded audio file using Deepgram.

    Validates file size and type before processing.
    Optionally classifies the transcript into a lead using LangChain.
    """
    # Validate file type
    mime_type = file.content_type or "audio/wav"
    if mime_type not in ALLOWED_AUDIO_TYPES and not mime_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail=f"Unsupported audio type: {mime_type}")

    audio_bytes = await file.read()

    # Validate file size
    if len(audio_bytes) > MAX_AUDIO_SIZE:
        raise HTTPException(status_code=413, detail="Audio file too large (max 25MB)")

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    logger.info("Transcribe: %s (%d bytes, %s)", file.filename, len(audio_bytes), mime_type)

    result = await transcribe_audio(audio_bytes, mime_type=mime_type)

    classification = None
    if classify and result["transcript"]:
        classified = await _safe_classify(result["transcript"])
        classification = classified.model_dump()

    return TranscribeResponse(
        transcript=result["transcript"],
        confidence=result["confidence"],
        duration_seconds=result["duration_seconds"],
        classification=classification,
        error=result.get("error"),
    )


@router.post("/voice/webhook")
async def voice_webhook(request: Request):
    """
    Webhook receiver for inbound voice calls (Twilio → Deepgram).

    Handles ALL edge cases:
    - No recording yet → prompt customer to speak
    - Empty/noisy transcript → ask customer to repeat
    - Low confidence → still attempt classification but flag it
    - Classification failure → fallback to keyword parsing
    - SMS failure → non-blocking, call still succeeds
    - Twilio signing validation (TODO: add for production)

    Returns TwiML in ALL cases — never returns JSON to Twilio.
    """
    try:
        form = await request.form()
    except Exception as exc:
        logger.error("Failed to parse webhook form data: %s", exc)
        return _twiml_error()

    recording_url = form.get("RecordingUrl")
    caller = form.get("From", "unknown")
    call_sid = form.get("CallSid", str(uuid.uuid4()))
    call_status = form.get("CallStatus", "")

    logger.info(
        "Voice webhook: caller=%s, call_sid=%s, status=%s, has_recording=%s",
        caller, call_sid, call_status, bool(recording_url),
    )

    lead_id = f"lead-{call_sid[:8]}"

    # Pre-load tradie context for this call (from Redis cache or DB)
    # For multi-user: match the called Twilio number to the right tradie profile
    tradie_ctx = {}
    tradie_ctx_text = ""
    try:
        async with get_db_context() as db:
            # Route to correct tradie based on the "To" phone number
            from sqlalchemy import select as sa_select
            from models.lead import UserProfile as UP
            called_number = form.get("To", "")
            profile_id = None
            if called_number:
                result = await db.execute(
                    sa_select(UP.id).where(
                        UP.inbound_config["identifier"].as_string() == called_number
                    ).limit(1)
                )
                row = result.scalar_one_or_none()
                if row:
                    profile_id = row

            tradie_ctx = await load_profile_context(db, user_profile_id=profile_id)
            tradie_ctx_text = get_profile_context_for_ai(tradie_ctx)
    except Exception as exc:
        logger.warning("Failed to load tradie context: %s — using defaults", exc)

    business_name = tradie_ctx.get("business_name", settings.default_business_name)

    # -----------------------------------------------------------------------
    # Case 1: No recording yet — first hit, prompt customer to record
    # -----------------------------------------------------------------------
    if not recording_url:
        return _twiml_greeting(business_name)

    # -----------------------------------------------------------------------
    # Case 2: Recording received — transcribe and process
    # -----------------------------------------------------------------------
    try:
        # Step 1: Transcribe with retry
        result = await _safe_transcribe(str(recording_url))
        transcript_text = result.get("transcript", "").strip()
        confidence = result.get("confidence", 0.0)

        # Edge case: Empty or very short transcript (noisy call / hung up early)
        if not transcript_text or len(transcript_text) < 5:
            logger.warning(
                "Empty/short transcript for call %s (confidence: %.2f). Asking to repeat.",
                call_sid, confidence,
            )
            return _twiml_retry()

        # Edge case: Very low confidence — noisy environment
        if confidence < 0.3:
            logger.warning(
                "Low confidence (%.2f) for call %s. Asking to repeat in quieter spot.",
                confidence, call_sid,
            )
            return _twiml_noisy()

        # Step 2: Classify (with tradie context) + SMS in parallel
        classify_task = _safe_classify(transcript_text, tradie_context=tradie_ctx_text)
        sms_task = _send_photo_sms(str(caller), lead_id)

        results = await asyncio.gather(classify_task, sms_task, return_exceptions=True)

        # Handle classify result
        classified = results[0]
        if isinstance(classified, Exception):
            logger.error("Classification failed: %s — using fallback", classified)
            from services.ai.langchain_agent import _fallback_classify
            classified = _fallback_classify(transcript_text)

        classification = classified.model_dump()

        # Step 3: Check service area — reject out-of-range customers
        if classified.suburb and classified.suburb != "unknown":
            service_radius = tradie_ctx.get("service_radius_km", 50)
            base_address = tradie_ctx.get("base_address", "")
            if base_address and classified.suburb:
                try:
                    from services.integrations.distance import calculate_distance
                    dist = await calculate_distance(base_address, classified.suburb)
                    if dist.distance_km > service_radius:
                        logger.info(
                            "Out of service area: %s is %.1f km away (radius: %.0f km)",
                            classified.suburb, dist.distance_km, service_radius,
                        )
                        return _twiml_out_of_area(classified.suburb, service_radius, business_name)
                except Exception as exc:
                    logger.warning("Distance check failed: %s — proceeding anyway", exc)

        # Step 4: Build lead with tradie context and broadcast
        next_slot = tradie_ctx.get("next_available_slots", [{}])
        next_slot_display = next_slot[0].get("display", "soon") if next_slot else "soon"

        lead_data = {
            "id": lead_id,
            "customerName": _format_phone(str(caller)),
            "customerPhone": str(caller),
            "address": classified.address,
            "suburb": classified.suburb,
            "urgency": classified.urgency,
            "status": "new",
            "jobType": classified.job_type,
            "description": classified.description,
            "partsNeeded": classified.parts_needed,
            "transcript": transcript_text,
            "transcriptConfidence": confidence,
            "tradieId": tradie_ctx.get("tradie_id"),
            "userProfileId": tradie_ctx.get("user_profile_id"),
            "businessName": business_name,
            "nextAvailableSlot": next_slot_display,
            "photoUrls": [],
            "quoteLines": [],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
        }

        # Broadcast + cache concurrently (both non-blocking)
        await asyncio.gather(
            lead_manager.broadcast_new_lead(lead_data),
            _cache_lead(lead_id, lead_data),
            _persist_voice_lead(lead_data),
            return_exceptions=True,
        )

        # Step 5: Return confirmation TwiML with business name + next slot
        job_display = classified.job_type.replace("_", " ")
        return _twiml_confirmation(job_display, business_name, next_slot_display)

    except Exception as exc:
        logger.error("Voice webhook processing failed for call %s: %s", call_sid, exc, exc_info=True)
        return _twiml_error()


@router.post("/voice/photos/{lead_id}")
async def upload_lead_photo_public(
    lead_id: str,
    file: UploadFile = File(...),
):
    """
    Public photo upload — NO AUTH REQUIRED (customer via SMS link).

    Validates file, analyses with Vision API, enhances with LangChain,
    and broadcasts to tradie mobile app.
    """
    # Validate file type
    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_IMAGE_TYPES and not mime_type.startswith("image/"):
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {mime_type}. Use JPEG, PNG, or WebP.")

    image_bytes = await file.read()

    # Validate file size
    if len(image_bytes) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    logger.info("Photo upload for lead %s: %d bytes, %s", lead_id, len(image_bytes), mime_type)

    try:
        from services.integrations.vision import analyse_image
        from services.ai.langchain_agent import enhance_vision_analysis

        # Vision + Enhancement can run sequentially (enhancement needs vision output)
        analysis = await analyse_image(image_bytes=image_bytes)

        enhanced = await enhance_vision_analysis(
            vision_labels=", ".join(analysis.labels) if analysis.labels else "unknown",
            job_context=f"Lead {lead_id}",
        )

        # Broadcast to tradie mobile app
        await lead_manager.broadcast_lead_update({
            "id": lead_id,
            "status": "photo_analysed",
            "photoAnalysis": {
                "labels": analysis.labels,
                "detected_objects": analysis.detected_objects,
                "detected_part": analysis.detected_part,
                "confidence": analysis.confidence,
                "suggested_sku_class": analysis.suggested_sku_class,
                "expert_notes": enhanced.notes,
                "severity": enhanced.severity,
            },
            "visionSummary": (
                f"Detected: {', '.join(analysis.detected_objects or analysis.labels[:3])}. "
                f"{enhanced.notes}"
            ),
        })

        return {
            "status": "analysed",
            "lead_id": lead_id,
            "detected_part": analysis.detected_part,
            "confidence": analysis.confidence,
            "expert_notes": enhanced.notes,
            "severity": enhanced.severity,
        }

    except Exception as exc:
        logger.error("Photo analysis failed for lead %s: %s", lead_id, exc, exc_info=True)
        await lead_manager.broadcast_lead_update({
            "id": lead_id,
            "status": "analysis_failed",
            "visionSummary": f"Photo analysis failed: {exc}",
        })
        raise HTTPException(status_code=503, detail=f"Photo analysis failed: {exc}")


@router.post("/voice/tts")
async def text_to_speech(req: TTSRequest):
    """Convert text to natural Australian speech."""
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    if len(req.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 chars)")

    audio_bytes = await generate_speech(req.text, voice_id=req.voice_id)

    if audio_bytes is None:
        raise HTTPException(status_code=503, detail="TTS service unavailable")

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=speech.mp3"},
    )


@router.post("/voice/token")
async def get_livekit_token(
    req: VoiceTokenRequest | None = None,
    user: User = Depends(get_current_user),
):
    """
    Get a LiveKit token for the logged-in user to start a voice session.
    Generates a unique room name for this session.
    """
    mode = (req.mode if req else "tradie_copilot").strip().lower()
    if mode not in {"tradie_copilot", "receptionist"}:
        raise HTTPException(status_code=400, detail="mode must be tradie_copilot or receptionist")

    # Create a unique room name for this session
    room_name = f"{mode}-{user.id}-{int(datetime.now(timezone.utc).timestamp())}"
    identity = f"user-{user.id}" if mode == "tradie_copilot" else f"caller-{user.id}"

    # Generate token for the participant
    token = await generate_participant_token(room_name, identity)
    
    if not token:
        raise HTTPException(status_code=500, detail="Failed to generate LiveKit token")
        
    return {
        "token": token,
        "url": settings.livekit_url,
        "room_name": room_name,
        "mode": mode,
        "identity": identity,
    }





class VoiceEventRequest(BaseModel):
    type: str
    status: str
    caller: str
    lead_id: str
    tradie_id: str | None = None


@router.post("/voice/event")
async def internal_voice_event(req: VoiceEventRequest):
    """
    Internal endpoint for Voice Workers to report status changes.
    Broadcasts events to the frontend via WebSocket.
    """
    if req.type == "call_status":
        await lead_manager.broadcast_call_status(
            status=req.status,
            caller=req.caller,
            lead_id=req.lead_id,
            tradie_id=req.tradie_id,
        )
    return {"status": "ok"}


class VoicePatchRequest(BaseModel):
    tradie_id: str
    operations: list[dict]


@router.post("/voice/patch")
async def internal_voice_patch(req: VoicePatchRequest):
    """
    Internal endpoint for Voice Workers to send UI patches (SDUI).
    """
    await lead_manager.send_to_tradie(req.tradie_id, {
        "type": "patch",
        "operations": req.operations
    })
    return {"status": "ok"}


@router.get("/voice/voices")
async def get_voices():
    """List available ElevenLabs voices."""
    voices = await list_voices()
    return {"voices": voices}


@router.get("/voice/status")
async def voice_pipeline_status():
    """Check the status of all voice pipeline services."""
    from core.config import settings

    return {
        "deepgram": {
            "configured": bool(settings.deepgram_api_key),
        },
        "elevenlabs": {
            "configured": bool(settings.elevenlabs_api_key),
            "voice_id": settings.elevenlabs_voice_id,
        },

        "twilio": {
            "configured": bool(settings.twilio_account_sid),
        },
        "websocket": {
            "connected_tradies": lead_manager.connected_tradies,
            "active_connections": lead_manager.active_count,
        },
    }


# ---------------------------------------------------------------------------
# TwiML Response Builders (all edge cases covered)
# ---------------------------------------------------------------------------

def _twiml_greeting(business_name: str = "") -> Response:
    business_name = business_name or settings.default_business_name
    """Initial call greeting — uses the tradie's business name."""
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Nicole" language="en-AU">
        G'day! Thanks for calling {business_name}. 
        Please describe the issue you're having, and let us know your address so we can get a tradie out to you.
        Speak clearly after the beep, and we'll sort you out with a quote right away.
    </Say>
    <Record maxLength="120" action="/api/voice/webhook" transcribe="false"
            playBeep="true" timeout="8" finishOnKey="#"
            recordingStatusCallback="/api/voice/webhook" />
    <Say voice="Polly.Nicole" language="en-AU">
        No worries, we didn't catch anything there. Let's try again, mate.
    </Say>
    <Record maxLength="120" action="/api/voice/webhook" transcribe="false"
            playBeep="true" timeout="10" finishOnKey="#" />
    <Say voice="Polly.Nicole" language="en-AU">
        All good — give us a call back when you're ready. Cheers!
    </Say>
    <Hangup />
</Response>"""
    return Response(content=xml, media_type="application/xml")


def _twiml_confirmation(job_type: str, business_name: str = "our plumber", next_slot: str = "soon") -> Response:
    """Confirmation with business name and next available slot."""
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Nicole" language="en-AU">
        Thanks mate! We've got your details — sounds like a {job_type} job.
        {business_name}'s next available slot is {next_slot}.
        A tradie will review your request and get back to you with a quote real quick.
        We've also sent you a text with a link to upload any photos of the issue.
        That'll help us nail down an accurate price for you. Cheers!
    </Say>
    <Hangup />
</Response>"""
    return Response(content=xml, media_type="application/xml")


def _twiml_out_of_area(suburb: str, radius_km: float, business_name: str = "our plumber") -> Response:
    """Politely decline — customer is outside the tradie's service area."""
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Nicole" language="en-AU">
        Thanks for calling {business_name}, mate.
        Unfortunately, {suburb} is outside our service area — we cover about {radius_km:.0f} kilometres from our base.
        We'd recommend searching for a local plumber in your area.
        Sorry about that, and best of luck getting it sorted. Cheers!
    </Say>
    <Hangup />
</Response>"""
    return Response(content=xml, media_type="application/xml")


def _twiml_retry() -> Response:
    """Ask customer to repeat — empty/short transcript."""
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Nicole" language="en-AU">
        Sorry mate, we didn't quite catch that. 
        Could you describe the plumbing issue again? 
        Try to include what's happening and your address. No rush.
    </Say>
    <Record maxLength="120" action="/api/voice/webhook" transcribe="false"
            playBeep="true" timeout="10" finishOnKey="#" />
    <Say voice="Polly.Nicole" language="en-AU">
        No worries — if you'd prefer, you can text us your details instead. Cheers!
    </Say>
    <Hangup />
</Response>"""
    return Response(content=xml, media_type="application/xml")


def _twiml_noisy() -> Response:
    """Ask customer to move to a quieter spot — low confidence."""
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Nicole" language="en-AU">
        G'day! There's a bit of background noise. 
        Could you move somewhere a bit quieter and describe the issue again?
        Just let us know what's happening and your address, and we'll get you sorted.
    </Say>
    <Record maxLength="120" action="/api/voice/webhook" transcribe="false"
            playBeep="true" timeout="10" finishOnKey="#" />
    <Say voice="Polly.Nicole" language="en-AU">
        All good mate — give us a call back when you're in a quieter spot. Cheers!
    </Say>
    <Hangup />
</Response>"""
    return Response(content=xml, media_type="application/xml")


def _twiml_error() -> Response:
    """Generic error — something went wrong server-side."""
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Nicole" language="en-AU">
        Sorry about that mate — we're having a bit of a technical issue on our end.
        Please try calling back in a minute or send us a text. Cheers!
    </Say>
    <Hangup />
</Response>"""
    return Response(content=xml, media_type="application/xml")


def _format_phone(phone: str) -> str:
    """Format phone number for display (best-effort)."""
    phone = phone.strip()
    if phone.startswith("+61"):
        # Australian number — format as 04XX XXX XXX
        digits = phone[3:]
        if len(digits) == 9:
            return f"0{digits[:3]} {digits[3:6]} {digits[6:]}"
    return phone
