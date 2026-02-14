"""
Deepgram Speech-to-Text service.

Ultra-tuned for Australian English with plumbing-specific terminology.
Uses Nova-2 model with en-AU locale, keyword boosting, and natural
speech handling (filler words, numerals, measurements).
"""

import logging
from typing import Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Australian plumbing vocabulary boost
# ---------------------------------------------------------------------------

# Plumbing trade terms — heavily boosted for accurate transcription
PLUMBING_TERMS = [
    "pipe:3", "pipes:3", "leak:3", "leaking:3", "leaky:3",
    "tap:3", "taps:3", "faucet:2", "mixer:3", "mixer tap:3",
    "drain:3", "drains:3", "blocked:3", "clogged:2",
    "toilet:3", "cistern:3", "flush:2", "dunny:2",
    "hot water:3", "hot water system:3", "hot water unit:3",
    "burst:3", "flooding:3", "overflow:2",
    "washer:2", "valve:2", "copper:2", "PVC:2",
    "fitting:2", "fittings:2", "elbow:2", "joint:2",
    "gas:3", "gas fitting:3", "gas leak:3",
    "plumber:3", "plumbing:3", "sewer:2", "stormwater:2",
    "backflow:2", "anode:2", "thermostat:2", "tempering valve:2",
    "polyethylene:2", "crimp:2", "soldering:2", "brazing:2",
]

# Gold Coast suburb names — boosted for address recognition
SUBURB_TERMS = [
    "Burleigh:3", "Burleigh Heads:3", "Southport:3", "Miami:2",
    "Palm Beach:3", "Mermaid Beach:3", "Mermaid Waters:3",
    "Gold Coast:3", "Broadbeach:3", "Surfers Paradise:3",
    "Robina:3", "Nerang:3", "Mudgeeraba:2", "Currumbin:2",
    "Coolangatta:2", "Varsity Lakes:2", "Helensvale:2",
    "Coomera:2", "Ormeau:2", "Oxenford:2", "Labrador:2",
    "Biggera Waters:2", "Runaway Bay:2", "Ashmore:2",
    "Merrimac:2", "Worongary:2", "Carrara:2",
    "Elanora:2", "Tugun:2", "Bilinga:2", "Kirra:2",
    "Pacific Parade:2", "Gold Coast Highway:2",
]

# Australian slang / conversational terms
AUSSIE_TERMS = [
    "arvo:2", "reckon:2", "mate:2", "no worries:2",
    "straight away:2", "bloody:1", "heaps:1",
]

# Combine all keywords
ALL_KEYWORDS = PLUMBING_TERMS + SUBURB_TERMS + AUSSIE_TERMS


async def transcribe_audio(
    audio_bytes: bytes,
    mime_type: str = "audio/wav",
    language: str = "en-AU",
) -> dict:
    """
    Transcribe audio using Deepgram Nova-2 with Australian English tuning.

    Features:
    - en-AU model for Australian accent recognition
    - Keyword boosting for plumbing terms + Gold Coast suburbs
    - Smart formatting (numbers, measurements, currency)
    - Filler word removal for cleaner transcripts
    - Numerals mode for proper address number handling
    """
    api_key = settings.deepgram_api_key
    if not api_key:
        logger.warning("No Deepgram API key — returning empty transcript")
        return _empty_result()

    url = "https://api.deepgram.com/v1/listen"

    # Build keyword parameter
    keywords = "&".join(f"keywords={kw}" for kw in ALL_KEYWORDS[:50])

    params = {
        # Model: Nova-2 is their fastest + most accurate
        "model": "nova-2",
        "language": language,

        # --- Accuracy tuning ---
        "smart_format": "true",      # Smart number/date formatting
        "punctuate": "true",         # Add punctuation
        "numerals": "true",          # "forty two" → "42" (for addresses)
        "measurements": "true",      # "fifteen millimetre" → "15mm"
        "filler_words": "false",     # Remove "um", "uh", "like" noise
        "profanity_filter": "false", # Don't censor (tradies swear)

        # --- Speaker handling ---
        "diarize": "true",           # Identify different speakers
        "utterances": "true",        # Split into sentences

        # --- Speed ---
        "tier": "nova",              # Fastest tier
    }

    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": mime_type,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Append keywords to URL since httpx doesn't handle repeated params well
            full_url = f"{url}?{keywords}" if keywords else url
            response = await client.post(
                full_url, params=params, headers=headers, content=audio_bytes,
            )
            response.raise_for_status()
            data = response.json()

        result = data.get("results", {})
        channels = result.get("channels", [{}])
        if not channels:
            return _empty_result()

        alt = channels[0].get("alternatives", [{}])[0]
        transcript = alt.get("transcript", "")
        confidence = alt.get("confidence", 0.0)
        words = alt.get("words", [])

        metadata = data.get("metadata", {})
        duration = metadata.get("duration", 0.0)

        logger.info(
            "Deepgram [en-AU]: %.1fs audio → %d chars (confidence: %.2f)",
            duration, len(transcript), confidence,
        )

        return {
            "transcript": transcript,
            "confidence": confidence,
            "words": [
                {
                    "word": w.get("word", ""),
                    "start": w.get("start", 0),
                    "end": w.get("end", 0),
                    "confidence": w.get("confidence", 0),
                    "speaker": w.get("speaker"),
                }
                for w in words
            ],
            "duration_seconds": duration,
            "utterances": result.get("utterances", []),
        }

    except httpx.HTTPStatusError as exc:
        logger.error("Deepgram HTTP error %d: %s", exc.response.status_code, exc.response.text[:200])
        return _empty_result(error=str(exc))
    except Exception as exc:
        logger.error("Deepgram transcription failed: %s", exc)
        return _empty_result(error=str(exc))


async def transcribe_url(audio_url: str, language: str = "en-AU") -> dict:
    """Transcribe audio from a URL (e.g., Twilio recording URL)."""
    api_key = settings.deepgram_api_key
    if not api_key:
        logger.warning("No Deepgram API key — returning empty transcript")
        return _empty_result()

    url = "https://api.deepgram.com/v1/listen"
    keywords = "&".join(f"keywords={kw}" for kw in ALL_KEYWORDS[:50])

    params = {
        "model": "nova-2",
        "language": language,
        "smart_format": "true",
        "punctuate": "true",
        "numerals": "true",
        "measurements": "true",
        "filler_words": "false",
        "diarize": "true",
        "utterances": "true",
        "tier": "nova",
    }

    headers = {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            full_url = f"{url}?{keywords}" if keywords else url
            response = await client.post(
                full_url, params=params, headers=headers,
                json={"url": audio_url},
            )
            response.raise_for_status()
            data = response.json()

        channels = data.get("results", {}).get("channels", [{}])
        if not channels:
            return _empty_result()

        alt = channels[0].get("alternatives", [{}])[0]
        return {
            "transcript": alt.get("transcript", ""),
            "confidence": alt.get("confidence", 0.0),
            "words": alt.get("words", []),
            "duration_seconds": data.get("metadata", {}).get("duration", 0.0),
        }

    except Exception as exc:
        logger.error("Deepgram URL transcription failed: %s", exc)
        return _empty_result(error=str(exc))


def _empty_result(error: Optional[str] = None) -> dict:
    """Return an empty transcription result."""
    return {
        "transcript": "",
        "confidence": 0.0,
        "words": [],
        "duration_seconds": 0.0,
        "error": error,
    }
