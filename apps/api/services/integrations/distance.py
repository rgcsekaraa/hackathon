"""
Google Distance Matrix integration.

Computes travel distance and time from tradie base to customer address.
Falls back to estimate based on straight-line distance when no API key.
"""

from __future__ import annotations
import logging
import httpx
from core.config import settings

logger = logging.getLogger(__name__)


class DistanceResult:
    def __init__(self, distance_km: float, duration_minutes: int, origin: str = "", destination: str = ""):
        self.distance_km = distance_km
        self.duration_minutes = duration_minutes
        self.origin = origin
        self.destination = destination

    def to_dict(self) -> dict:
        return {
            "distance_km": self.distance_km,
            "duration_minutes": self.duration_minutes,
            "origin": self.origin,
            "destination": self.destination,
        }


async def calculate_distance(origin: str, destination: str) -> DistanceResult:
    """
    Calculate travel distance and time using Google Distance Matrix API.

    Falls back to a mock estimate if no API key is configured.
    """
    if not settings.google_maps_api_key:
        logger.info("No Maps API key -- returning mock distance")
        return _mock_distance(origin, destination)

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/distancematrix/json",
                params={
                    "origins": origin,
                    "destinations": destination,
                    "key": settings.google_maps_api_key,
                    "units": "metric",
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            data = resp.json()

        element = data["rows"][0]["elements"][0]
        if element["status"] != "OK":
            logger.warning("Distance Matrix returned status: %s", element["status"])
            return _mock_distance(origin, destination)

        distance_km = round(element["distance"]["value"] / 1000, 1)
        duration_minutes = round(element["duration"]["value"] / 60)

        return DistanceResult(
            distance_km=distance_km,
            duration_minutes=duration_minutes,
            origin=origin,
            destination=destination,
        )

    except Exception as e:
        logger.error("Distance Matrix error: %s -- falling back to mock", e)
        return _mock_distance(origin, destination)


def _mock_distance(origin: str, destination: str) -> DistanceResult:
    """
    Generate a plausible mock distance for demo purposes.

    Uses address heuristics: Gold Coast suburbs are roughly 10-30km apart.
    """
    # Suburb-based estimates (Gold Coast / SE QLD focus)
    SUBURB_DISTANCES: dict[str, float] = {
        "burleigh": 12.5,
        "surfers": 18.0,
        "broadbeach": 15.0,
        "robina": 8.0,
        "nerang": 10.0,
        "southport": 20.0,
        "coolangatta": 25.0,
        "palm beach": 14.0,
        "mermaid": 16.0,
        "miami": 13.0,
        "varsity": 7.0,
        "mudgeeraba": 6.0,
        "ormeau": 22.0,
        "coomera": 28.0,
        "helensvale": 24.0,
    }

    dest_lower = destination.lower()
    for suburb, km in SUBURB_DISTANCES.items():
        if suburb in dest_lower:
            minutes = int(km * 2.2)  # Rough: ~2.2 min/km in suburban traffic
            return DistanceResult(km, minutes, origin, destination)

    # Default fallback
    return DistanceResult(15.0, 22, origin, destination)
