"""
Pluggable Parts Pricing Provider.

Demo uses cached sample data (Bunnings-style prices).
Designed to be replaceable with a real API (Bunnings partner, Reece, etc.).
"""

from __future__ import annotations
import logging
import re
import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class PartPrice:
    def __init__(self, sku_class: str, name: str, price: float, source: str = "cached_estimate"):
        self.sku_class = sku_class
        self.name = name
        self.price = price
        self.source = source

    def to_dict(self) -> dict:
        return {
            "sku_class": self.sku_class,
            "name": self.name,
            "price": self.price,
            "source": self.source,
        }


# ---------------------------------------------------------------------------
# Cached pricing database (Bunnings-style estimates, AUD)
# ---------------------------------------------------------------------------

PARTS_CATALOGUE: dict[str, PartPrice] = {
    # Taps
    "mixer_tap_15mm": PartPrice("mixer_tap_15mm", "Methven Minimalist Basin Mixer Tap", 189.00, "Bunnings estimate"),
    "kitchen_mixer": PartPrice("kitchen_mixer", "Dorf Flickmixer Kitchen Tap", 159.00, "Bunnings estimate"),
    "garden_tap": PartPrice("garden_tap", "Brass Hose Cock 15mm", 18.50, "Bunnings estimate"),
    "tap_washer_kit": PartPrice("tap_washer_kit", "Tap Washer Assortment Kit", 8.90, "Bunnings estimate"),

    # Toilet
    "cistern_valve_standard": PartPrice("cistern_valve_standard", "Fluidmaster Universal Fill Valve", 29.00, "Bunnings estimate"),
    "toilet_seat": PartPrice("toilet_seat", "Caroma Soft Close Toilet Seat", 79.00, "Bunnings estimate"),
    "wax_ring": PartPrice("wax_ring", "Toilet Wax Ring Seal", 12.50, "Bunnings estimate"),

    # Pipes
    "copper_elbow_15mm": PartPrice("copper_elbow_15mm", "15mm Copper Elbow 90°", 4.50, "Bunnings estimate"),
    "copper_tee_15mm": PartPrice("copper_tee_15mm", "15mm Copper Tee", 5.80, "Bunnings estimate"),
    "pvc_pipe_50mm": PartPrice("pvc_pipe_50mm", "50mm PVC DWV Pipe (1m)", 14.90, "Bunnings estimate"),
    "pipe_repair_clamp": PartPrice("pipe_repair_clamp", "Pipe Repair Clamp 15-22mm", 22.00, "Bunnings estimate"),

    # Drain
    "drain_snake_standard": PartPrice("drain_snake_standard", "Drain Snake 6m", 35.00, "Bunnings estimate"),
    "drain_cleaner": PartPrice("drain_cleaner", "Draino Professional Strength 1L", 12.00, "Bunnings estimate"),

    # Hot water
    "hw_thermostat": PartPrice("hw_thermostat", "Hot Water Thermostat Element", 45.00, "Bunnings estimate"),
    "hw_anode": PartPrice("hw_anode", "Sacrificial Anode Rod", 65.00, "Bunnings estimate"),
    "tempering_valve": PartPrice("tempering_valve", "Tempering Valve 20mm", 120.00, "Bunnings estimate"),

    # General
    "ptfe_tape": PartPrice("ptfe_tape", "PTFE Thread Tape 12mm", 3.50, "Bunnings estimate"),
    "silicone_sealant": PartPrice("silicone_sealant", "Selleys Wet Area Silicone", 14.50, "Bunnings estimate"),
}


async def lookup_parts_price(sku_class: str | None) -> PartPrice | None:
    """
    Look up the price for a part by SKU class.

    Currently uses cached catalogue. In production, this would call
    the Bunnings Partner API or similar.
    """
    if not sku_class:
        return None

    if settings.pricing_live_enabled and settings.serpapi_api_key:
        live = await _lookup_live_price(sku_class)
        if live:
            logger.info("Found live part price: %s = $%.2f (%s)", live.name, live.price, live.source)
            return live

    part = PARTS_CATALOGUE.get(sku_class)
    if part:
        logger.info("Found cached part price: %s = $%.2f (%s)", part.name, part.price, part.source)
        return part

    logger.info("Part not found in catalogue: %s", sku_class)
    return None


async def _lookup_live_price(sku_class: str) -> PartPrice | None:
    baseline = PARTS_CATALOGUE.get(sku_class)
    query = baseline.name if baseline else sku_class.replace("_", " ")

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(
                "https://serpapi.com/search.json",
                params={
                    "engine": "google_shopping",
                    "q": query,
                    "gl": "au",
                    "hl": "en",
                    "api_key": settings.serpapi_api_key,
                    "num": 5,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        results = data.get("shopping_results") or []
        if not results:
            return None

        for item in results:
            price_val = _parse_price(item.get("extracted_price") or item.get("price"))
            if price_val is None or price_val <= 0:
                continue
            title = str(item.get("title") or query)
            source = str(item.get("source") or "google_shopping")
            return PartPrice(sku_class, title, round(price_val, 2), f"live:{source}")
    except Exception as exc:
        logger.warning("Live price lookup failed for %s: %s", sku_class, exc)

    return None


def _parse_price(value: object) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None
    cleaned = re.sub(r"[^0-9.]", "", value)
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


async def search_parts(query: str) -> list[PartPrice]:
    """Search the parts catalogue by name or SKU class."""
    query_lower = query.lower()
    results = []
    for part in PARTS_CATALOGUE.values():
        if query_lower in part.name.lower() or query_lower in part.sku_class:
            results.append(part)
    return results
