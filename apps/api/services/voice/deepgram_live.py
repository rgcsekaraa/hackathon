"""
Deepgram Live Streaming STT — real-time audio transcription.

Opens a persistent WebSocket to Deepgram's streaming API.
Audio chunks are forwarded in real-time, and transcripts are
received via callbacks (interim + final).

Same en-AU config and keyword boosting as the batch API.
"""

import asyncio
import json
import logging
from typing import Callable, Optional, Awaitable

import websockets

from core.config import settings
from .deepgram_stt import ALL_KEYWORDS

logger = logging.getLogger(__name__)

DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen"


class DeepgramLiveClient:
    """
    Real-time streaming transcription via Deepgram WebSocket.

    Usage:
        client = DeepgramLiveClient(on_transcript=my_callback)
        await client.connect()
        await client.send_audio(chunk)  # µ-law 8kHz from Twilio
        ...
        await client.close()
    """

    def __init__(
        self,
        on_transcript: Callable[[str, float, bool], Awaitable[None]],
        on_utterance_end: Optional[Callable[[], Awaitable[None]]] = None,
        language: str = "en-AU",
    ):
        """
        Args:
            on_transcript: async callback(text, confidence, is_final)
            on_utterance_end: async callback when speaker pauses
            language: Deepgram language model
        """
        self.on_transcript = on_transcript
        self.on_utterance_end = on_utterance_end
        self.language = language
        self._ws: Optional[websockets.WebSocketClientProtocol] = None
        self._listen_task: Optional[asyncio.Task] = None
        self._closed = False

    async def connect(self) -> None:
        """Open WebSocket connection to Deepgram."""
        api_key = settings.deepgram_api_key
        if not api_key:
            logger.error("No Deepgram API key — cannot open live stream")
            return

        # Build query params matching our batch config
        params = {
            "model": "nova-2",
            "language": self.language,
            "punctuate": "true",
            "smart_format": "true",
            "numerals": "true",
            "measurements": "true",
            "filler_words": "false",
            "profanity_filter": "false",
            "interim_results": "true",
            "utterance_end_ms": "1500",     # 1.5s silence = utterance boundary
            "endpointing": "300",           # 300ms for fast sentence detection
            "vad_events": "true",           # Voice activity detection
            "encoding": "mulaw",            # Twilio sends µ-law
            "sample_rate": "8000",          # Twilio sends 8kHz
            "channels": "1",               # Mono
        }

        # Add keyword boosting (top 50)
        keyword_params = "&".join(f"keywords={kw}" for kw in ALL_KEYWORDS[:50])
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        if keyword_params:
            query_string += "&" + keyword_params

        url = f"{DEEPGRAM_WS_URL}?{query_string}"

        headers = {"Authorization": f"Token {api_key}"}

        try:
            self._ws = await websockets.connect(
                url,
                additional_headers=headers,
                ping_interval=20,
                ping_timeout=10,
            )
            self._closed = False
            self._listen_task = asyncio.create_task(self._listen())
            logger.info("Deepgram Live connected (en-AU, µ-law 8kHz)")
        except Exception as exc:
            logger.error("Failed to connect to Deepgram Live: %s", exc)
            raise

    async def send_audio(self, audio_bytes: bytes) -> None:
        """Send raw audio chunk to Deepgram (µ-law 8kHz from Twilio)."""
        if self._ws and not self._closed:
            try:
                await self._ws.send(audio_bytes)
            except Exception as exc:
                logger.warning("Failed to send audio to Deepgram: %s", exc)

    async def close(self) -> None:
        """Close the Deepgram WebSocket connection."""
        self._closed = True
        if self._ws:
            try:
                # Send close message to Deepgram
                await self._ws.send(json.dumps({"type": "CloseStream"}))
                await self._ws.close()
            except Exception:
                pass
        if self._listen_task:
            self._listen_task.cancel()
            try:
                await self._listen_task
            except asyncio.CancelledError:
                pass
        logger.info("Deepgram Live disconnected")

    async def _listen(self) -> None:
        """Background task: receive transcripts from Deepgram."""
        if not self._ws:
            return

        try:
            async for message in self._ws:
                if self._closed:
                    break

                try:
                    data = json.loads(message)
                except json.JSONDecodeError:
                    continue

                msg_type = data.get("type", "")

                if msg_type == "Results":
                    channel = data.get("channel", {})
                    alternatives = channel.get("alternatives", [{}])
                    if not alternatives:
                        continue

                    alt = alternatives[0]
                    transcript = alt.get("transcript", "").strip()
                    confidence = alt.get("confidence", 0.0)
                    is_final = data.get("is_final", False)
                    speech_final = data.get("speech_final", False)

                    if transcript:
                        await self.on_transcript(transcript, confidence, is_final or speech_final)

                elif msg_type == "UtteranceEnd":
                    if self.on_utterance_end:
                        await self.on_utterance_end()

                elif msg_type == "SpeechStarted":
                    logger.debug("Speech started")

                elif msg_type == "Metadata":
                    logger.debug("Deepgram metadata: %s", data.get("request_id", ""))

                elif msg_type == "Error":
                    logger.error("Deepgram error: %s", data.get("message", "unknown"))

        except websockets.ConnectionClosed:
            logger.info("Deepgram WebSocket connection closed")
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.error("Deepgram listener error: %s", exc)
