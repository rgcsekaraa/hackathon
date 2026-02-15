
import asyncio
import httpx
import os
import sys
import sqlite3
import uuid
import json

# Adjust paths if running from root
DB_PATH = "apps/api/spatial_voice.db"
API_URL = "http://localhost:8000"

def ensure_admin_profile():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get superadmin ID
    cursor.execute("SELECT id FROM users WHERE email='superadmin@sophiie.ai'")
    user = cursor.fetchone()
    if not user:
        print("Superadmin not found in DB!")
        return None
    user_id = user[0]
    
    # Check profile
    cursor.execute("SELECT id FROM user_profiles WHERE user_id=?", (user_id,))
    profile = cursor.fetchone()
    
    if not profile:
        print("Creating profile for Superadmin...")
        profile_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO user_profiles (
                id, user_id, business_name, service_types, 
                base_callout_fee, hourly_rate, markup_pct, min_labour_hours, 
                base_address, service_radius_km, travel_rate_per_km, timezone,
                working_hours, inbound_config, is_active, is_gmail_setup,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, 
                    80.0, 95.0, 15.0, 1.0, 
                    '1 Admin St', 50.0, 1.5, 'Australia/Brisbane',
                    '{}', '{}', 1, 0,
                    datetime('now'), datetime('now'))
        """, (profile_id, user_id, "Admin Test Plumbing", '["general"]'))
        conn.commit()
    else:
        print("Superadmin profile exists.")
    
    conn.close()
    return True

async def simulate():
    print(f"Connecting to {API_URL}...")
    async with httpx.AsyncClient() as client:
        # Login
        try:
            resp = await client.post(f"{API_URL}/auth/login", json={
                "email": "superadmin@sophiie.ai",
                "password": "d3m0-p@s5"
            })
            if resp.status_code != 200:
                print("Login failed:", resp.text)
                return
            
            token = resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            
            # Create Lead
            lead_data = {
                "customer_name": "John Doe (Simulation)",
                "customer_phone": "0400 123 456",
                "customer_address": "123 Simulation St, Gold Coast",
                "job_description": "I have a burst pipe in the kitchen, water is everywhere! Please help.",
                "urgency": "emergency"
            }
            
            print("Sending lead data...")
            resp = await client.post(f"{API_URL}/api/leads", json=lead_data, headers=headers)
            if resp.status_code == 201:
                print("✅ Successfully simulated new lead!")
                print("Lead ID:", resp.json()["id"])
                print("Check the Dashboard now.")
            else:
                print("❌ Failed to create lead:", resp.text)
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    if ensure_admin_profile():
        asyncio.run(simulate())
