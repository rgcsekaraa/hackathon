
import asyncio
import os
import sys

# Ensure we can import from current directory
# This assumes we run from apps/api
sys.path.append(os.getcwd())

from sqlalchemy import select
from db.session import engine, get_db_context
from models.base import Base
# Import all required models to register them
from models.user import User
from models import UserProfile

from core.auth import get_password_hash

async def init_models():
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

async def seed_users():
    async with get_db_context() as db:
        # Check if demo user exists
        stmt = select(User).where(User.email == "demo@example.com")
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            print("Creating demo user...")
            demo_user = User(
                id="user-demo",
                email="demo@example.com",
                full_name="Demo Tradie",
                hashed_password=get_password_hash("demo123"),
                role="member",
                is_active=True,
                is_verified=True,
                google_id=None
            )
            db.add(demo_user)
            
            # Create User Profile
            profile = UserProfile(
                id="profile-demo",
                user_id="user-demo",
                business_name="Demo Electrical",
                base_address="123 Main St, Sydney NSW 2000",
                service_radius_km=50,
                base_callout_fee=80.0,
                hourly_rate=95.0,
                timezone="Australia/Sydney",
                # Default generic values for missing fields
                service_types=["electrical"],
                markup_pct=15.0,
                min_labour_hours=1.0,
                travel_rate_per_km=1.5
            )
            db.add(profile)
            
            await db.commit()
            print("Demo user created!")
        else:
            print("Demo user already exists.")

async def main():
    print("Initializing database...")
    await init_models()
    print("Seeding data...")
    await seed_users()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
