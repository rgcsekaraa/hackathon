"""
ElevenLabs Streaming TTS — real-time text-to-speech via WebSocket.

Sends text chunks and receives audio chunks for immediate playback.
Output is µ-law 8kHz for direct injection into Twilio Media Streams.

Uses the same Australian voice settings as the batch TTS.
"""

import asyncio
import audioop
import base64
import json
import logging
from typing import AsyncIterator, Optional

import websockets

from core.config import settings
from .elevenlabs_tts import PHONE_VOICE_SETTINGS

logger = logging.getLogger(__name__)

ELEVENLABS_WS_URL = "wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input"


async def stream_tts_to_mulaw(
    text: str,
    voice_id: Optional[str] = None,
) -> AsyncIterator[bytes]:
    """
    Stream TTS and yield µ-law 8kHz audio chunks for Twilio.

    ElevenLabs outputs PCM → we convert to µ-law 8kHz on-the-fly
    for injection into Twilio's Media Stream.

    Yields:
        bytes: µ-law encoded audio chunks (base64-ready)
    """
    api_key = settings.elevenlabs_api_key
    if not api_key:
        logger.warning("No ElevenLabs API key — skipping streaming TTS")
        return

    vid = voice_id or settings.elevenlabs_voice_id
    url = ELEVENLABS_WS_URL.format(voice_id=vid)

    try:
        async with websockets.connect(
            url,
            additional_headers={"xi-api-key": api_key},
            ping_interval=20,
        ) as ws:
            # Send initial config (BOS - Beginning of Stream)
            bos_message = {
                "text": " ",  # Space triggers connection setup
                "voice_settings": PHONE_VOICE_SETTINGS,
                "xi_api_key": api_key,
                "generation_config": {
                    "chunk_length_schedule": [120, 160, 250, 290],
                },
                "output_format": "pcm_24000",  # 24kHz PCM, we'll downsample
                "model_id": "eleven_turbo_v2_5",
            }
            await ws.send(json.dumps(bos_message))

            # Send the actual text
            text_message = {
                "text": text,
                "try_trigger_generation": True,
                "flush": True,
            }
            await ws.send(json.dumps(text_message))

            # Send EOS (End of Stream) to signal we're done sending text
            eos_message = {"text": ""}
            await ws.send(json.dumps(eos_message))

            # Receive audio chunks
            async for message in ws:
                try:
                    data = json.loads(message)
                except json.JSONDecodeError:
                    continue

                if data.get("audio"):
                    # Decode base64 PCM audio from ElevenLabs
                    pcm_24k = base64.b64decode(data["audio"])

                    # Convert: PCM 24kHz → PCM 8kHz → µ-law 8kHz
                    # Step 1: Downsample 24kHz → 8kHz (ratio 3:1)
                    pcm_8k, _ = audioop.ratecv(
                        pcm_24k, 2, 1, 24000, 8000, None
                    )
                    # Step 2: Convert PCM → µ-law
                    mulaw_audio = audioop.lin2ulaw(pcm_8k, 2)

                    yield mulaw_audio

                if data.get("isFinal"):
                    break

    except Exception as exc:
        logger.error("ElevenLabs streaming TTS failed: %s", exc)


async def generate_mulaw_audio(text: str, voice_id: Optional[str] = None) -> bytes:
    """
    Generate complete µ-law audio from text (non-streaming convenience).

    Useful for short responses where you want the full audio buffer
    before sending to Twilio.
    """
    chunks = []
    async for chunk in stream_tts_to_mulaw(text, voice_id):
        chunks.append(chunk)
    return b"".join(chunks)


def pcm_to_mulaw_8k(pcm_audio: bytes, source_rate: int = 24000) -> bytes:
    """
    Convert PCM audio to µ-law 8kHz for Twilio.

    Twilio Media Streams expect:
    - Encoding: µ-law (PCMU)
    - Sample rate: 8000 Hz
    - Channels: 1 (mono)
    - Sample width: 2 bytes (16-bit)
    """
    if source_rate != 8000:
        pcm_audio, _ = audioop.ratecv(
            pcm_audio, 2, 1, source_rate, 8000, None
        )
    return audioop.lin2ulaw(pcm_audio, 2)
