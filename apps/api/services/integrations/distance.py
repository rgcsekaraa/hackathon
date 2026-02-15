"""
Distance integration.

Uses real providers only:
1. Google Distance Matrix (if key configured)
2. OSM geocoding + OSRM routing fallback
"""

from __future__ import annotations

import logging
import math

import httpx

from core.config import settings
from core.retry import retry_async

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
    Calculate travel distance and duration.

    Provider order:
    1. Google Distance Matrix
    2. OSM + OSRM
    """
    if not origin.strip() or not destination.strip():
        raise RuntimeError("Origin and destination are required for distance lookup")

    if settings.google_maps_api_key:
        try:
            return await _distance_google(origin, destination)
        except Exception as exc:
            logger.warning("Google Distance Matrix failed, falling back to OSM/OSRM: %s", exc)

    return await _distance_osrm(origin, destination)


async def _distance_google(origin: str, destination: str) -> DistanceResult:
    async def _do_distance_request() -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://maps.googleapis.com/maps/api/distancematrix/json",
                params={
                    "origins": origin,
                    "destinations": destination,
                    "key": settings.google_maps_api_key,
                    "units": "metric",
                },
            )
            resp.raise_for_status()
            return resp.json()

    data = await retry_async(
        _do_distance_request,
        max_attempts=2,
        base_delay=0.5,
        max_delay=3.0,
        retryable_exceptions=(httpx.HTTPStatusError, httpx.ConnectError, httpx.ReadTimeout),
    )

    element = data["rows"][0]["elements"][0]
    if element["status"] != "OK":
        raise RuntimeError(f"Distance Matrix returned status: {element['status']}")

    distance_km = round(element["distance"]["value"] / 1000, 1)
    duration_minutes = max(1, round(element["duration"]["value"] / 60))
    return DistanceResult(distance_km, duration_minutes, origin, destination)


async def _distance_osrm(origin: str, destination: str) -> DistanceResult:
    origin_lat, origin_lon = await _geocode_osm(origin)
    dest_lat, dest_lon = await _geocode_osm(destination)

    route_url = (
        "https://router.project-osrm.org/route/v1/driving/"
        f"{origin_lon},{origin_lat};{dest_lon},{dest_lat}"
    )

    async with httpx.AsyncClient(timeout=12.0) as client:
        resp = await client.get(route_url, params={"overview": "false"})
        resp.raise_for_status()
        data = resp.json()

    routes = data.get("routes") or []
    if routes:
        route = routes[0]
        distance_km = round(float(route.get("distance", 0.0)) / 1000.0, 1)
        duration_minutes = max(1, round(float(route.get("duration", 0.0)) / 60.0))
        return DistanceResult(distance_km, duration_minutes, origin, destination)

    # If OSRM doesn't return route data, use geodesic distance from real coordinates.
    straight_km = _haversine_km(origin_lat, origin_lon, dest_lat, dest_lon)
    duration_minutes = max(1, round((straight_km / 40.0) * 60.0))
    return DistanceResult(round(straight_km, 1), duration_minutes, origin, destination)


async def _geocode_osm(address: str) -> tuple[float, float]:
    headers = {
        "User-Agent": "sophiie-orbit/1.0 (distance-service)",
        "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
        resp = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "jsonv2", "limit": 1},
        )
        resp.raise_for_status()
        rows = resp.json()

    if not rows:
        raise RuntimeError(f"OSM geocoding failed for address: {address}")

    return float(rows[0]["lat"]), float(rows[0]["lon"])


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    return radius_km * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
