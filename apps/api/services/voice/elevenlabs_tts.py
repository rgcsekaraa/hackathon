"""
ElevenLabs Text-to-Speech service — Australian accent.

Configured for natural, warm Australian speech. Uses ElevenLabs' 
low-latency turbo model for instant responses.

Voice: "Charlotte" (Australian female) or custom voice.
Tuned for conversational, friendly tone — not robotic.
"""

import logging
from typing import Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"

# ---------------------------------------------------------------------------
# Australian Voice Presets
# ---------------------------------------------------------------------------
# ElevenLabs doesn't have a native "Australian" voice, so we use
# voice settings tuned for natural, warm delivery + Australian phrasing
# in the text itself.
#
# Recommended voices:
#   Charlotte: XB0fDUnXU5powFXDhCwa (warm female, works well with Aussie text)
#   Daniel:    onwK4e9ZLuTAKqWW03F9 (professional male)
#   Adam:      pNInz6obpgDQGcFmaJgB (deep male — default)
#
# For a TRUE Australian accent, clone a voice on ElevenLabs with
# 3-5 minutes of Australian speech samples.
# ---------------------------------------------------------------------------

# Voice settings tuned for natural Australian speech
AUSTRALIAN_VOICE_SETTINGS = {
    "stability": 0.45,            # Slightly lower = more expressive/natural
    "similarity_boost": 0.78,     # High similarity to original voice
    "style": 0.35,                # Some style variation for naturalness
    "use_speaker_boost": True,    # Clearer audio quality
}

# For phone calls — optimised for telephony
PHONE_VOICE_SETTINGS = {
    "stability": 0.50,            # More stable for phone audio quality
    "similarity_boost": 0.80,
    "style": 0.25,                # Less style variation — clearer over phone
    "use_speaker_boost": True,
}


async def generate_speech(
    text: str,
    voice_id: Optional[str] = None,
    model_id: str = "eleven_turbo_v2_5",
    output_format: str = "mp3_44100_128",
    phone_mode: bool = False,
) -> Optional[bytes]:
    """
    Convert text to natural Australian-sounding speech.

    Uses turbo model for <500ms latency. Voice settings are tuned
    for warm, conversational Australian delivery.

    Args:
        text: Text to convert (should use Australian phrasing)
        voice_id: Override voice (default from config)
        model_id: ElevenLabs model (turbo_v2_5 = fastest)
        output_format: Audio format
        phone_mode: If True, uses telephony-optimised settings
    """
    api_key = settings.elevenlabs_api_key
    if not api_key:
        logger.warning("No ElevenLabs API key — skipping TTS")
        return None

    vid = voice_id or settings.elevenlabs_voice_id

    url = f"{ELEVENLABS_API_URL}/text-to-speech/{vid}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }

    voice_settings = PHONE_VOICE_SETTINGS if phone_mode else AUSTRALIAN_VOICE_SETTINGS

    payload = {
        "text": text,
        "model_id": model_id,
        "voice_settings": voice_settings,
    }
    params = {"output_format": output_format}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers, params=params)
            response.raise_for_status()

        audio_bytes = response.content
        logger.info(
            "ElevenLabs TTS [AU]: %d chars → %d bytes (voice: %s, phone: %s)",
            len(text), len(audio_bytes), vid, phone_mode,
        )
        return audio_bytes

    except httpx.HTTPStatusError as exc:
        logger.error(
            "ElevenLabs HTTP error %d: %s",
            exc.response.status_code, exc.response.text[:200],
        )
        return None
    except Exception as exc:
        logger.error("ElevenLabs TTS failed: %s", exc)
        return None


async def generate_quote_callback(
    customer_name: str,
    quote_total: float,
    job_type: str,
    scheduled_date: str,
    scheduled_slot: str,
    business_name: str,
    voice_id: Optional[str] = None,
) -> Optional[bytes]:
    """
    Generate a spoken quote confirmation in natural Australian English.

    The narration text uses Australian phrasing:
    - "G'day" instead of "Hello"
    - "No worries" instead of "No problem"  
    - "Cheers" instead of "Thank you"
    - "mate" naturally
    """
    try:
        from services.ai.langchain_agent import generate_quote_narration

        narration_text = await generate_quote_narration(
            customer_name=customer_name,
            job_type=job_type.replace("_", " "),
            address="",
            suburb="",
            quote_total=quote_total,
            scheduled_date=scheduled_date,
            scheduled_slot=scheduled_slot,
            business_name=business_name,
        )
    except Exception:
        # Fallback with natural Australian phrasing
        job_display = job_type.replace("_", " ")
        narration_text = (
            f"G'day {customer_name}! Great news mate — your quote from {business_name} "
            f"for the {job_display} is ${quote_total:.2f} including GST. "
            f"Your plumber's booked in for {scheduled_date} between {scheduled_slot}. "
            f"We'll give you a buzz when we're on our way. No worries, we've got you covered. Cheers!"
        )

    # Use phone mode for callback calls
    return await generate_speech(narration_text, voice_id=voice_id, phone_mode=True)


async def generate_greeting() -> Optional[bytes]:
    """Generate the initial call greeting in Australian English."""
    greeting = (
        "G'day! Thanks for calling. I'm here to help sort out your plumbing issue. "
        "Just let us know what's going on, where you are, and we'll get a tradie "
        "out to you as quick as we can. Fire away, mate!"
    )
    return await generate_speech(greeting, phone_mode=True)


async def generate_followup(missing_info: str) -> Optional[bytes]:
    """Generate a natural follow-up question in Australian English."""
    text = (
        f"No worries at all! Just a quick one — could you let us know {missing_info}? "
        f"That'll help us get the right gear and give you an accurate price."
    )
    return await generate_speech(text, phone_mode=True)


async def generate_confirmation(job_type: str) -> Optional[bytes]:
    """Generate a call-end confirmation in Australian English."""
    job_display = job_type.replace("_", " ")
    text = (
        f"Ripper, thanks mate! We've got your details for the {job_display}. "
        f"A tradie will review your job and get back to you with a quote real quick. "
        f"We've also sent you a text with a link to upload any photos. "
        f"That'll help us give you a spot-on price. Cheers!"
    )
    return await generate_speech(text, phone_mode=True)


async def list_voices() -> list[dict]:
    """List available ElevenLabs voices."""
    api_key = settings.elevenlabs_api_key
    if not api_key:
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{ELEVENLABS_API_URL}/voices",
                headers={"xi-api-key": api_key},
            )
            response.raise_for_status()
            data = response.json()

        return [
            {
                "voice_id": v["voice_id"],
                "name": v["name"],
                "category": v.get("category", ""),
                "labels": v.get("labels", {}),
            }
            for v in data.get("voices", [])
        ]
    except Exception as exc:
        logger.error("Failed to list voices: %s", exc)
        return []
