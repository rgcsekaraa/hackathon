import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_db():
    print("Testing DB connection...")
    engine = create_async_engine("sqlite+aiosqlite:///./test_db.db")
    async with engine.begin() as conn:
        print("Connected! Running query...")
        await conn.execute(text("SELECT 1"))
        print("Query successful!")
    await engine.dispose()
    print("Engine disposed.")

if __name__ == "__main__":
    asyncio.run(test_db())
