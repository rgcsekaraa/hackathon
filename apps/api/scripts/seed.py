#!/usr/bin/env python3
"""
Seed script — populates the database with demo accounts and realistic data.

Creates:
  - 2 tradie accounts with full business profiles
  - Workspace tasks/projects for each
  - Lead sessions at various pipeline stages with quotes

Usage:
  cd apps/api
  python scripts/seed.py          # local
  python scripts/seed.py --reset  # drop + recreate tables first

On Railway, run as a one-off command:
  cd apps/api && python scripts/seed.py
"""

import asyncio
import argparse
import sys
import os
import uuid
from datetime import datetime, timedelta, timezone

# Ensure the api directory is on the path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.auth import get_password_hash
from core.config import settings
from db.session import engine, AsyncSessionLocal
from models.base import Base
from models.user import User
from models.lead import UserProfile, LeadSession, QuoteLineItem, LeadStatus, UrgencyLevel
from models.workspace import WorkspaceComponent
from models.project import Project


def uid() -> str:
    return str(uuid.uuid4())


NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime("%Y-%m-%d")
TOMORROW = (NOW + timedelta(days=1)).strftime("%Y-%m-%d")
DAY_AFTER = (NOW + timedelta(days=2)).strftime("%Y-%m-%d")


# ---- Account 1: Gold Coast Plumbing (Mike) ----
MIKE_USER_ID = uid()
MIKE_PROFILE_ID = uid()
MIKE_PROJECT_ID = uid()

# ---- Account 2: Sunshine Plumbing (Sarah) ----
SARAH_USER_ID = uid()
SARAH_PROFILE_ID = uid()
SARAH_PROJECT_ID = uid()


def build_users() -> list[User]:
    return [
        User(
            id=MIKE_USER_ID,
            email="mike@goldcoastplumbing.com.au",
            full_name="Mike Henderson",
            hashed_password=get_password_hash("Demo1234!"),
            role="admin",
            is_active=True,
            is_verified=True,
            created_at=NOW - timedelta(days=30),
        ),
        User(
            id=SARAH_USER_ID,
            email="sarah@sunshineplumbing.com.au",
            full_name="Sarah Mitchell",
            hashed_password=get_password_hash("Demo1234!"),
            role="admin",
            is_active=True,
            is_verified=True,
            created_at=NOW - timedelta(days=14),
        ),
    ]


def build_profiles() -> list[UserProfile]:
    return [
        UserProfile(
            id=MIKE_PROFILE_ID,
            user_id=MIKE_USER_ID,
            business_name="Gold Coast Plumbing",
            service_types=["tap_repair", "toilet", "drainage", "hot_water", "gas_fitting", "burst_pipe"],
            base_callout_fee=85.0,
            hourly_rate=105.0,
            markup_pct=15.0,
            min_labour_hours=1.0,
            base_address="12 Hibiscus Haven, Burleigh Heads, QLD 4220",
            base_lat=-28.0873,
            base_lng=153.4424,
            service_radius_km=35.0,
            travel_rate_per_km=1.80,
            timezone="Australia/Brisbane",
            working_hours={
                "mon": ["07:00-17:00"],
                "tue": ["07:00-17:00"],
                "wed": ["07:00-17:00"],
                "thu": ["07:00-17:00"],
                "fri": ["07:00-15:00"],
                "sat": ["08:00-12:00"],
            },
            inbound_config={
                "persona": "friendly Australian tradie",
                "source": "twilio",
                "identifier": settings.twilio_phone_number or "+61400000001",
            },
            is_active=True,
            created_at=NOW - timedelta(days=30),
        ),
        UserProfile(
            id=SARAH_PROFILE_ID,
            user_id=SARAH_USER_ID,
            business_name="Sunshine Plumbing Co",
            service_types=["tap_repair", "toilet", "drainage", "hot_water", "backflow"],
            base_callout_fee=75.0,
            hourly_rate=95.0,
            markup_pct=12.0,
            min_labour_hours=1.0,
            base_address="5 Ocean View Parade, Mermaid Beach, QLD 4218",
            base_lat=-28.0441,
            base_lng=153.4318,
            service_radius_km=25.0,
            travel_rate_per_km=1.50,
            timezone="Australia/Brisbane",
            working_hours={
                "mon": ["08:00-16:30"],
                "tue": ["08:00-16:30"],
                "wed": ["08:00-16:30"],
                "thu": ["08:00-16:30"],
                "fri": ["08:00-16:30"],
            },
            inbound_config={
                "persona": "professional and warm",
                "source": "web",
                "identifier": "+61400000002",
            },
            is_active=True,
            created_at=NOW - timedelta(days=14),
        ),
    ]


def build_leads() -> tuple[list[LeadSession], list[QuoteLineItem]]:
    leads = []
    items = []

    # ---- Mike's Leads ----

    # Lead 1: Booked — mixer tap repair in Southport
    lead1_id = uid()
    leads.append(LeadSession(
        id=lead1_id,
        user_profile_id=MIKE_PROFILE_ID,
        status=LeadStatus.BOOKED.value,
        customer_name="Jenny Nguyen",
        customer_phone="+61412345678",
        customer_address="42 Marine Parade, Southport, QLD 4215",
        customer_lat=-27.9672,
        customer_lng=153.4130,
        job_type="tap_repair",
        job_description="Kitchen mixer tap dripping constantly. Moen brand, about 5 years old. Leak is from the base of the spout.",
        urgency=UrgencyLevel.THIS_WEEK.value,
        photo_analysis={"detected_part": "mixer_tap", "confidence": 0.91, "suggested_sku_class": "mixer_tap_15mm"},
        quote_total=342.50,
        quote_snapshot={
            "callout": 85.0, "labour": 105.0, "parts": 78.20,
            "travel": 36.0, "subtotal": 304.20, "gst": 30.42, "total": 334.62,
        },
        distance_km=18.5,
        travel_minutes=22,
        tradie_decision="approve",
        tradie_notes="Standard mixer cartridge replacement. Got the part on the van.",
        booked_date=TOMORROW,
        booked_time_slot="morning",
        booked_at=NOW - timedelta(hours=3),
        conversation=[
            {"role": "customer", "text": "G'day, I've got a leaky mixer tap in the kitchen.", "ts": (NOW - timedelta(hours=4)).isoformat()},
            {"role": "ai", "text": "No worries! Can you tell me the brand and where exactly it's leaking from?", "ts": (NOW - timedelta(hours=4, minutes=-1)).isoformat()},
            {"role": "customer", "text": "It's a Moen, leaking from the base when I turn it on.", "ts": (NOW - timedelta(hours=3, minutes=58)).isoformat()},
            {"role": "ai", "text": "Got it — sounds like the cartridge needs replacing. What's your address so we can get a tradie out?", "ts": (NOW - timedelta(hours=3, minutes=57)).isoformat()},
            {"role": "customer", "text": "42 Marine Parade, Southport.", "ts": (NOW - timedelta(hours=3, minutes=55)).isoformat()},
        ],
        created_at=NOW - timedelta(hours=4),
    ))
    items.extend([
        QuoteLineItem(id=uid(), lead_id=lead1_id, category="callout", label="Callout Fee", quantity=1, unit_price=85.0, total=85.0),
        QuoteLineItem(id=uid(), lead_id=lead1_id, category="labour", label="Labour (1 hr)", quantity=1, unit_price=105.0, total=105.0),
        QuoteLineItem(id=uid(), lead_id=lead1_id, category="parts", label="Moen Mixer Cartridge", quantity=1, unit_price=68.0, total=78.20, notes="15% markup"),
        QuoteLineItem(id=uid(), lead_id=lead1_id, category="travel", label="Travel (18.5km)", quantity=18.5, unit_price=1.80, total=33.30),
        QuoteLineItem(id=uid(), lead_id=lead1_id, category="gst", label="GST (10%)", quantity=1, unit_price=30.15, total=30.15),
    ])

    # Lead 2: Tradie Review — emergency burst pipe in Robina
    lead2_id = uid()
    leads.append(LeadSession(
        id=lead2_id,
        user_profile_id=MIKE_PROFILE_ID,
        status=LeadStatus.TRADIE_REVIEW.value,
        customer_name="Tom Bradley",
        customer_phone="+61423456789",
        customer_address="8 Robina Town Centre Dr, Robina, QLD 4226",
        customer_lat=-28.0780,
        customer_lng=153.3852,
        job_type="burst_pipe",
        job_description="Pipe burst under the house. Water everywhere. Need someone ASAP.",
        urgency=UrgencyLevel.EMERGENCY.value,
        photo_urls=["https://storage.example.com/photos/burst-pipe-001.jpg"],
        photo_analysis={"detected_part": "copper_pipe_joint", "confidence": 0.85, "suggested_sku_class": "copper_elbow_15mm"},
        quote_total=587.40,
        quote_snapshot={
            "callout": 85.0, "labour": 210.0, "parts": 145.50,
            "travel": 14.40, "subtotal": 454.90, "gst": 45.49, "total": 500.39,
        },
        distance_km=8.0,
        travel_minutes=12,
        conversation=[
            {"role": "customer", "text": "Mate, I've got a burst pipe under the house, water's going everywhere!", "ts": (NOW - timedelta(hours=1)).isoformat()},
            {"role": "ai", "text": "Crikey, that's no good. First thing — can you find the water mains and turn it off? It's usually near the front boundary.", "ts": (NOW - timedelta(minutes=59)).isoformat()},
            {"role": "customer", "text": "Yeah done that already. Can someone come out now?", "ts": (NOW - timedelta(minutes=57)).isoformat()},
        ],
        created_at=NOW - timedelta(hours=1),
    ))
    items.extend([
        QuoteLineItem(id=uid(), lead_id=lead2_id, category="callout", label="Emergency Callout", quantity=1, unit_price=85.0, total=85.0),
        QuoteLineItem(id=uid(), lead_id=lead2_id, category="labour", label="Labour (2 hrs)", quantity=2, unit_price=105.0, total=210.0),
        QuoteLineItem(id=uid(), lead_id=lead2_id, category="parts", label="15mm Copper Elbows + Couplings", quantity=1, unit_price=126.50, total=145.48, notes="15% markup"),
        QuoteLineItem(id=uid(), lead_id=lead2_id, category="travel", label="Travel (8km)", quantity=8, unit_price=1.80, total=14.40),
        QuoteLineItem(id=uid(), lead_id=lead2_id, category="gst", label="GST (10%)", quantity=1, unit_price=45.49, total=45.49),
    ])

    # Lead 3: New — just came in, toilet running
    lead3_id = uid()
    leads.append(LeadSession(
        id=lead3_id,
        user_profile_id=MIKE_PROFILE_ID,
        status=LeadStatus.NEW.value,
        customer_name="Lisa Chen",
        customer_phone="+61434567890",
        customer_address="15 Palm Beach Rd, Palm Beach, QLD 4221",
        job_type="toilet",
        job_description="Toilet keeps running after flushing. Tried jiggling the handle but it won't stop.",
        urgency=UrgencyLevel.TOMORROW.value,
        conversation=[
            {"role": "customer", "text": "Hi, my toilet won't stop running after I flush it.", "ts": (NOW - timedelta(minutes=10)).isoformat()},
        ],
        created_at=NOW - timedelta(minutes=10),
    ))

    # Lead 4: Confirmed — drainage, SMS sent
    lead4_id = uid()
    leads.append(LeadSession(
        id=lead4_id,
        user_profile_id=MIKE_PROFILE_ID,
        status=LeadStatus.CONFIRMED.value,
        customer_name="Dave Williams",
        customer_phone="+61445678901",
        customer_address="23 Gold Coast Hwy, Mermaid Beach, QLD 4218",
        job_type="drainage",
        job_description="Shower drain completely blocked. Water pooling and not going down at all.",
        urgency=UrgencyLevel.TODAY.value,
        quote_total=295.00,
        distance_km=15.2,
        travel_minutes=20,
        tradie_decision="approve",
        booked_date=TODAY,
        booked_time_slot="afternoon",
        booked_at=NOW - timedelta(hours=2),
        conversation=[
            {"role": "customer", "text": "Shower drain's completely blocked, can't use it.", "ts": (NOW - timedelta(hours=5)).isoformat()},
            {"role": "ai", "text": "No worries mate, we'll get that sorted. What's your address?", "ts": (NOW - timedelta(hours=5, minutes=-1)).isoformat()},
            {"role": "customer", "text": "23 Gold Coast Hwy, Mermaid Beach.", "ts": (NOW - timedelta(hours=4, minutes=58)).isoformat()},
        ],
        created_at=NOW - timedelta(hours=5),
    ))

    # ---- Sarah's Leads ----

    # Lead 5: Booked — hot water system
    lead5_id = uid()
    leads.append(LeadSession(
        id=lead5_id,
        user_profile_id=SARAH_PROFILE_ID,
        status=LeadStatus.BOOKED.value,
        customer_name="Rachel Green",
        customer_phone="+61456789012",
        customer_address="9 Hedges Ave, Broadbeach, QLD 4218",
        customer_lat=-28.0275,
        customer_lng=153.4310,
        job_type="hot_water",
        job_description="No hot water since yesterday morning. Electric system, about 8 years old. Rheem brand.",
        urgency=UrgencyLevel.TODAY.value,
        photo_analysis={"detected_part": "hot_water_unit", "confidence": 0.88, "suggested_sku_class": "hw_thermostat"},
        quote_total=425.00,
        quote_snapshot={
            "callout": 75.0, "labour": 190.0, "parts": 95.20,
            "travel": 10.50, "subtotal": 370.70, "gst": 37.07, "total": 407.77,
        },
        distance_km=7.0,
        travel_minutes=11,
        tradie_decision="approve",
        tradie_notes="Likely thermostat or element. Bringing both just in case.",
        booked_date=TODAY,
        booked_time_slot="morning",
        booked_at=NOW - timedelta(hours=6),
        conversation=[
            {"role": "customer", "text": "Hi, we've had no hot water since yesterday. It's a Rheem electric system.", "ts": (NOW - timedelta(hours=8)).isoformat()},
            {"role": "ai", "text": "That's not ideal! How old is the unit roughly?", "ts": (NOW - timedelta(hours=7, minutes=59)).isoformat()},
            {"role": "customer", "text": "About 8 years I think.", "ts": (NOW - timedelta(hours=7, minutes=57)).isoformat()},
        ],
        created_at=NOW - timedelta(hours=8),
    ))
    items.extend([
        QuoteLineItem(id=uid(), lead_id=lead5_id, category="callout", label="Callout Fee", quantity=1, unit_price=75.0, total=75.0),
        QuoteLineItem(id=uid(), lead_id=lead5_id, category="labour", label="Labour (2 hrs)", quantity=2, unit_price=95.0, total=190.0),
        QuoteLineItem(id=uid(), lead_id=lead5_id, category="parts", label="Thermostat + Element", quantity=1, unit_price=85.0, total=95.20, notes="12% markup"),
        QuoteLineItem(id=uid(), lead_id=lead5_id, category="travel", label="Travel (7km)", quantity=7, unit_price=1.50, total=10.50),
        QuoteLineItem(id=uid(), lead_id=lead5_id, category="gst", label="GST (10%)", quantity=1, unit_price=37.07, total=37.07),
    ])

    # Lead 6: Pricing stage — backflow test
    lead6_id = uid()
    leads.append(LeadSession(
        id=lead6_id,
        user_profile_id=SARAH_PROFILE_ID,
        status=LeadStatus.PRICING.value,
        customer_name="James Park",
        customer_phone="+61467890123",
        customer_address="101 Surfers Paradise Blvd, Surfers Paradise, QLD 4217",
        job_type="backflow",
        job_description="Need annual backflow prevention test for the business. Council compliance requirement.",
        urgency=UrgencyLevel.THIS_WEEK.value,
        distance_km=12.3,
        travel_minutes=18,
        conversation=[
            {"role": "customer", "text": "I need a backflow test done for council compliance.", "ts": (NOW - timedelta(hours=2)).isoformat()},
        ],
        created_at=NOW - timedelta(hours=2),
    ))

    return leads, items


def build_projects() -> list[Project]:
    return [
        Project(
            id=MIKE_PROJECT_ID,
            name="This Week's Jobs",
            description="Active jobs and follow-ups for the current week",
            user_id=MIKE_USER_ID,
            created_at=NOW - timedelta(days=7),
        ),
        Project(
            id=SARAH_PROJECT_ID,
            name="Weekly Schedule",
            description="Scheduled inspections and repairs",
            user_id=SARAH_USER_ID,
            created_at=NOW - timedelta(days=5),
        ),
    ]


def build_workspace_tasks() -> list[WorkspaceComponent]:
    tasks = []

    # Mike's tasks
    mike_tasks = [
        ("Nguyen mixer tap — Southport", "morning", TOMORROW, "high", False, "Moen cartridge replacement. Part on the van."),
        ("Bradley burst pipe — Robina", "early_morning", TODAY, "urgent", False, "Emergency callout. Copper pipe repair under house."),
        ("Chen toilet running — Palm Beach", None, TOMORROW, "normal", False, "Inlet valve likely. Call to confirm time."),
        ("Williams drain unblock — Mermaid Beach", "afternoon", TODAY, "high", False, "Shower drain fully blocked."),
        ("Order copper fittings from Reece", "morning", DAY_AFTER, "normal", False, None),
        ("Lodge BAS quarterly", None, DAY_AFTER, "low", False, None),
        ("Replied to Garcia re: quote follow-up", None, TODAY, "normal", True, None),
    ]
    for i, (title, slot, date, priority, completed, desc) in enumerate(mike_tasks):
        tasks.append(WorkspaceComponent(
            id=uid(),
            user_id=MIKE_USER_ID,
            project_id=MIKE_PROJECT_ID,
            title=title,
            description=desc,
            priority=priority,
            date=date,
            time_slot=slot,
            completed=completed,
            order_index=i,
            created_at=NOW - timedelta(days=1, hours=i),
        ))

    # Sarah's tasks
    sarah_tasks = [
        ("Green hot water — Broadbeach", "morning", TODAY, "high", False, "Rheem electric, 8yrs old. Thermostat or element."),
        ("Park backflow test — Surfers", "afternoon", TOMORROW, "normal", False, "Council compliance test."),
        ("Bunnings run — pickup valves", "morning", TOMORROW, "normal", False, None),
        ("Quote follow-up: Kim bathroom reno", None, DAY_AFTER, "normal", False, None),
        ("Update insurance docs", None, DAY_AFTER, "low", False, None),
    ]
    for i, (title, slot, date, priority, completed, desc) in enumerate(sarah_tasks):
        tasks.append(WorkspaceComponent(
            id=uid(),
            user_id=SARAH_USER_ID,
            project_id=SARAH_PROJECT_ID,
            title=title,
            description=desc,
            priority=priority,
            date=date,
            time_slot=slot,
            completed=completed,
            order_index=i,
            created_at=NOW - timedelta(days=1, hours=i),
        ))

    return tasks


async def seed(reset: bool = False):
    """Run the seed."""
    from models.base import Base
    import models  # noqa: F401 — registers all models

    if reset:
        print("Dropping all tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing = (await db.execute(select(User).limit(1))).scalar_one_or_none()
        if existing and not reset:
            print(f"Database already has data (found user: {existing.email}). Use --reset to reseed.")
            return

        print("Seeding users...")
        users = build_users()
        db.add_all(users)
        await db.flush()

        print("Seeding business profiles...")
        profiles = build_profiles()
        db.add_all(profiles)
        await db.flush()

        print("Seeding leads + quotes...")
        leads, line_items = build_leads()
        db.add_all(leads)
        await db.flush()
        db.add_all(line_items)
        await db.flush()

        print("Seeding projects...")
        projects = build_projects()
        db.add_all(projects)
        await db.flush()

        print("Seeding workspace tasks...")
        tasks = build_workspace_tasks()
        db.add_all(tasks)

        await db.commit()

    print()
    print("=" * 60)
    print("  SEED COMPLETE")
    print("=" * 60)
    print()
    print("  Demo Accounts (password: Demo1234!)")
    print("  ─────────────────────────────────────")
    print("  1. mike@goldcoastplumbing.com.au")
    print("     → Gold Coast Plumbing | 6 service types | 4 leads")
    print("  2. sarah@sunshineplumbing.com.au")
    print("     → Sunshine Plumbing Co | 5 service types | 2 leads")
    print()
    print("  Data seeded:")
    print(f"    Users:           {len(users)}")
    print(f"    Profiles:        {len(profiles)}")
    print(f"    Leads:           {len(leads)}")
    print(f"    Quote Items:     {len(line_items)}")
    print(f"    Projects:        {len(projects)}")
    print(f"    Workspace Tasks: {len(tasks)}")
    print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the database with demo data")
    parser.add_argument("--reset", action="store_true", help="Drop all tables and reseed from scratch")
    args = parser.parse_args()

    asyncio.run(seed(reset=args.reset))
