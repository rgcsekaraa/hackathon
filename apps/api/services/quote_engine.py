"""
Deterministic Quote Engine.

AI classifies the job; this engine calculates prices using tradie-defined rules.
Never let AI set prices directly -- always use deterministic rules.
"""

from __future__ import annotations
import uuid
from typing import Optional
from schemas.lead import QuoteBreakdown, QuoteLineItemSchema


def calculate_quote(
    *,
    callout_fee: float = 80.0,
    hourly_rate: float = 95.0,
    min_labour_hours: float = 1.0,
    estimated_hours: float = 1.0,
    parts_cost: float = 0.0,
    markup_pct: float = 15.0,
    distance_km: float = 0.0,
    travel_rate_per_km: float = 1.50,
    include_gst: bool = True,
) -> QuoteBreakdown:
    """
    Build a deterministic, explainable quote breakdown.

    Returns a QuoteBreakdown with itemised line items.
    """
    labour_hours = max(min_labour_hours, estimated_hours)
    items: list[QuoteLineItemSchema] = []

    # 1. Callout fee
    items.append(QuoteLineItemSchema(
        category="callout",
        label="Call-out Fee",
        quantity=1,
        unit_price=callout_fee,
        total=callout_fee,
    ))

    # 2. Labour
    labour_total = round(labour_hours * hourly_rate, 2)
    items.append(QuoteLineItemSchema(
        category="labour",
        label=f"Labour ({labour_hours:.1f} hrs @ ${hourly_rate:.2f}/hr)",
        quantity=labour_hours,
        unit_price=hourly_rate,
        total=labour_total,
    ))

    # 3. Parts (with markup)
    if parts_cost > 0:
        parts_with_markup = round(parts_cost * (1 + markup_pct / 100), 2)
        items.append(QuoteLineItemSchema(
            category="parts",
            label=f"Parts (incl. {markup_pct:.0f}% markup)",
            quantity=1,
            unit_price=parts_with_markup,
            total=parts_with_markup,
            notes=f"Base parts cost: ${parts_cost:.2f}",
        ))

    # 4. Travel surcharge
    if distance_km > 0 and travel_rate_per_km > 0:
        travel_total = round(distance_km * travel_rate_per_km, 2)
        items.append(QuoteLineItemSchema(
            category="travel",
            label=f"Travel ({distance_km:.1f} km @ ${travel_rate_per_km:.2f}/km)",
            quantity=distance_km,
            unit_price=travel_rate_per_km,
            total=travel_total,
        ))

    # Subtotal
    subtotal = round(sum(item.total for item in items), 2)

    # 5. GST (10% in Australia)
    gst = 0.0
    if include_gst:
        gst = round(subtotal * 0.10, 2)
        items.append(QuoteLineItemSchema(
            category="gst",
            label="GST (10%)",
            quantity=1,
            unit_price=gst,
            total=gst,
        ))

    total = round(subtotal + gst, 2)

    return QuoteBreakdown(
        line_items=items,
        subtotal=subtotal,
        gst=gst,
        total=total,
        currency="AUD",
    )


# ---------------------------------------------------------------------------
# Job-type labour estimation
# ---------------------------------------------------------------------------

# Rough estimates for common plumbing jobs (hours)
LABOUR_ESTIMATES: dict[str, float] = {
    "tap_repair": 1.0,
    "tap_replacement": 1.5,
    "toilet_repair": 1.5,
    "toilet_replacement": 2.5,
    "blocked_drain": 1.5,
    "hot_water_repair": 2.0,
    "hot_water_replacement": 4.0,
    "leak_repair": 1.5,
    "pipe_burst": 2.0,
    "gas_fitting": 2.5,
    "general_plumbing": 1.5,
}


def estimate_labour_hours(job_type: str) -> float:
    """Return estimated labour hours for a job type."""
    return LABOUR_ESTIMATES.get(job_type, 1.5)
