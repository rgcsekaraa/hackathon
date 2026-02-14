"""
Google Cloud Vision integration for photo analysis.

Detects objects and labels in customer-uploaded photos to identify
tap types, fixtures, and parts. Falls back to mock data when no API key.
"""

from __future__ import annotations
import logging
import httpx
from schemas.lead import PhotoAnalysis
from core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Mock data for demo (no API key)
# ---------------------------------------------------------------------------

MOCK_ANALYSES: dict[str, PhotoAnalysis] = {
    "default": PhotoAnalysis(
        labels=["tap", "faucet", "plumbing", "sink", "bathroom"],
        detected_objects=["Mixer Tap", "Basin"],
        detected_part="mixer_tap",
        confidence=0.87,
        suggested_sku_class="mixer_tap_15mm",
    ),
    "toilet": PhotoAnalysis(
        labels=["toilet", "bathroom", "plumbing", "cistern"],
        detected_objects=["Toilet", "Cistern"],
        detected_part="toilet_cistern",
        confidence=0.91,
        suggested_sku_class="cistern_valve_standard",
    ),
    "pipe": PhotoAnalysis(
        labels=["pipe", "leak", "water", "copper", "plumbing"],
        detected_objects=["Copper Pipe", "Joint"],
        detected_part="copper_pipe_joint",
        confidence=0.82,
        suggested_sku_class="copper_elbow_15mm",
    ),
}


async def analyse_image(image_url: str | None = None, image_bytes: bytes | None = None) -> PhotoAnalysis:
    """
    Analyse a photo using Google Cloud Vision.

    Falls back to mock analysis if no API key is configured.
    """
    if not settings.google_cloud_vision_key:
        logger.info("No Vision API key -- returning mock analysis")
        return MOCK_ANALYSES["default"]

    try:
        # Build request for Google Cloud Vision
        if image_url:
            image_source = {"source": {"imageUri": image_url}}
        elif image_bytes:
            import base64
            image_source = {"content": base64.b64encode(image_bytes).decode()}
        else:
            return MOCK_ANALYSES["default"]

        payload = {
            "requests": [{
                "image": image_source,
                "features": [
                    {"type": "LABEL_DETECTION", "maxResults": 10},
                    {"type": "OBJECT_LOCALIZATION", "maxResults": 5},
                ]
            }]
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://vision.googleapis.com/v1/images:annotate?key={settings.google_cloud_vision_key}",
                json=payload,
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()

        response = data.get("responses", [{}])[0]
        labels = [a["description"] for a in response.get("labelAnnotations", [])]
        objects = [o["name"] for o in response.get("localizedObjectAnnotations", [])]

        # Map detected labels to part classification
        detected_part, sku_class = _classify_part(labels, objects)
        confidence = max(
            (a.get("score", 0) for a in response.get("labelAnnotations", [])),
            default=0.0,
        )

        return PhotoAnalysis(
            labels=labels,
            detected_objects=objects,
            detected_part=detected_part,
            confidence=round(confidence, 2),
            suggested_sku_class=sku_class,
        )

    except Exception as e:
        logger.error("Vision API error: %s -- falling back to mock", e)
        return MOCK_ANALYSES["default"]


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
