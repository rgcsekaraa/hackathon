"""
Image analysis integration for photo uploads.

Provider order:
1. Google Cloud Vision (if GOOGLE_CLOUD_VISION_KEY exists)
2. OpenRouter multimodal fallback (if OPENROUTER_API_KEY exists)
"""

from __future__ import annotations
import base64
import json
import logging
from typing import Optional
import httpx
from schemas.lead import PhotoAnalysis
from core.config import settings
from core.retry import retry_async

logger = logging.getLogger(__name__)

async def analyse_image(image_url: str | None = None, image_bytes: bytes | None = None) -> PhotoAnalysis:
    """
    Analyse a photo using a real provider.

    Raises RuntimeError when no provider is configured or analysis fails.
    """
    if not image_url and not image_bytes:
        raise RuntimeError("Image analysis requires image_url or image_bytes")

    # Try Google first when configured.
    if settings.google_cloud_vision_key:
        try:
            return await _analyse_with_google_vision(image_url=image_url, image_bytes=image_bytes)
        except Exception as exc:
            logger.warning("Google Vision failed, trying OpenRouter vision fallback: %s", exc)

    # Fallback to OpenRouter multimodal when configured.
    if settings.openrouter_api_key:
        return await _analyse_with_openrouter(image_url=image_url, image_bytes=image_bytes)

    raise RuntimeError(
        "No image analysis provider configured. Set GOOGLE_CLOUD_VISION_KEY or OPENROUTER_API_KEY."
    )


async def _analyse_with_google_vision(
    image_url: str | None = None,
    image_bytes: bytes | None = None,
) -> PhotoAnalysis:
    if image_url:
        image_source = {"source": {"imageUri": image_url}}
    else:
        image_source = {"content": base64.b64encode(image_bytes or b"").decode()}

    payload = {
        "requests": [{
            "image": image_source,
            "features": [
                {"type": "LABEL_DETECTION", "maxResults": 10},
                {"type": "OBJECT_LOCALIZATION", "maxResults": 5},
            ]
        }]
    }

    async def _do_vision_request() -> dict:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"https://vision.googleapis.com/v1/images:annotate?key={settings.google_cloud_vision_key}",
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    data = await retry_async(
        _do_vision_request,
        max_attempts=2,
        base_delay=0.5,
        max_delay=3.0,
        retryable_exceptions=(httpx.HTTPStatusError, httpx.ConnectError, httpx.ReadTimeout),
    )

    response = data.get("responses", [{}])[0]
    labels = [a["description"] for a in response.get("labelAnnotations", [])]
    objects = [o["name"] for o in response.get("localizedObjectAnnotations", [])]
    detected_part, sku_class = _classify_part(labels, objects)
    confidence = max(
        (a.get("score", 0) for a in response.get("labelAnnotations", [])),
        default=0.0,
    )

    if not labels and not objects:
        raise RuntimeError("Google Vision returned no labels/objects")

    return PhotoAnalysis(
        labels=labels,
        detected_objects=objects,
        detected_part=detected_part,
        confidence=round(confidence, 2),
        suggested_sku_class=sku_class,
    )


async def _analyse_with_openrouter(
    image_url: str | None = None,
    image_bytes: bytes | None = None,
) -> PhotoAnalysis:
    if image_url:
        image_part = {"type": "image_url", "image_url": {"url": image_url}}
    else:
        b64 = base64.b64encode(image_bytes or b"").decode()
        mime = _detect_mime_type(image_bytes)
        image_part = {
            "type": "image_url",
            "image_url": {"url": f"data:{mime};base64,{b64}"},
        }

    prompt = (
        "Analyse this plumbing photo and return strict JSON with keys: "
        "labels (string[]), detected_objects (string[]), confidence (0..1), "
        "detected_part (string|null), suggested_sku_class (string|null). "
        "No markdown. No extra keys."
    )

    # Try dedicated vision model first, then fall back to known multimodal models.
    model_candidates = []
    for candidate in [
        settings.openrouter_vision_model,
        "openai/gpt-4o-mini",
        settings.openrouter_model,
    ]:
        c = (candidate or "").strip()
        if c and c not in model_candidates:
            model_candidates.append(c)

    last_error: str | None = None
    data: dict | None = None
    for model in model_candidates:
        payload = {
            "model": model,
            "temperature": 0.0,
            "max_tokens": 300,
            "messages": [
                {"role": "system", "content": "You extract structured visual data for plumbing parts."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        image_part,
                    ],
                },
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    f"{settings.openrouter_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.openrouter_api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if resp.status_code >= 400:
                    last_error = f"{resp.status_code}: {resp.text[:300]}"
                    logger.warning("OpenRouter vision model %s failed: %s", model, last_error)
                    continue
                data = resp.json()
                break
        except Exception as exc:
            last_error = str(exc)
            logger.warning("OpenRouter vision model %s exception: %s", model, exc)
            continue

    if not data:
        raise RuntimeError(f"OpenRouter vision failed: {last_error or 'unknown error'}")

    content = data["choices"][0]["message"]["content"]
    if isinstance(content, list):
        content = "".join(str(c.get("text", "")) for c in content if isinstance(c, dict))
    content = str(content).strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    parsed = json.loads(content)

    labels = [str(v) for v in parsed.get("labels", []) if v]
    objects = [str(v) for v in parsed.get("detected_objects", []) if v]
    detected_part = parsed.get("detected_part")
    sku_class = parsed.get("suggested_sku_class")
    confidence = float(parsed.get("confidence", 0.0))

    # Backfill classification if model omitted it.
    if not detected_part and not sku_class:
        inferred_part, inferred_sku = _classify_part(labels, objects)
        detected_part = inferred_part
        sku_class = inferred_sku

    if not labels and not objects:
        raise RuntimeError("OpenRouter vision returned no labels/objects")

    return PhotoAnalysis(
        labels=labels,
        detected_objects=objects,
        detected_part=detected_part,
        confidence=max(0.0, min(1.0, round(confidence, 2))),
        suggested_sku_class=sku_class,
    )


def _detect_mime_type(image_bytes: Optional[bytes]) -> str:
    if not image_bytes:
        return "image/jpeg"
    b = image_bytes
    if b.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if b.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if b[:4] == b"RIFF" and b[8:12] == b"WEBP":
        return "image/webp"
    return "image/jpeg"


def _classify_part(labels: list[str], objects: list[str]) -> tuple[str | None, str | None]:
    """Map Vision API results to a part classification."""
    all_text = " ".join(labels + objects).lower()

    if any(w in all_text for w in ["tap", "faucet", "mixer"]):
        return "mixer_tap", "mixer_tap_15mm"
    if any(w in all_text for w in ["toilet", "cistern"]):
        return "toilet_cistern", "cistern_valve_standard"
    if any(w in all_text for w in ["pipe", "copper", "pvc"]):
        return "copper_pipe_joint", "copper_elbow_15mm"
    if any(w in all_text for w in ["drain", "blocked"]):
        return "drain", "drain_snake_standard"
    if any(w in all_text for w in ["hot water", "heater"]):
        return "hot_water_unit", "hw_thermostat"

    return None, None
