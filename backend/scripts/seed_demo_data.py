"""
Seed demo data for Adverlyx Digital platform.
Run this script to populate the database with sample data for demos.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import random
from dotenv import load_dotenv

load_dotenv()

# Connect to MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'adverlyx')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


async def seed_users():
    """Create demo users."""
    print("Seeding users...")
    
    demo_users = [
        {"name": "Sarah Mitchell", "email": "sarah@demo.com", "plan": "pro"},
        {"name": "Marcus Johnson", "email": "marcus@demo.com", "plan": "enterprise"},
        {"name": "Elena Rodriguez", "email": "elena@demo.com", "plan": "basic"},
        {"name": "David Chen", "email": "david@demo.com", "plan": "pro"},
        {"name": "Amanda Foster", "email": "amanda@demo.com", "plan": "basic"},
        {"name": "James Wilson", "email": "james@demo.com", "plan": "pro"},
        {"name": "Lisa Wang", "email": "lisa@demo.com", "plan": "enterprise"},
        {"name": "Michael Brown", "email": "michael@demo.com", "plan": "basic"},
    ]
    
    for user_data in demo_users:
        existing = await db.users.find_one({"email": user_data["email"]})
        if existing:
            continue
            
        user = {
            "id": str(uuid.uuid4()),
            "email": user_data["email"],
            "name": user_data["name"],
            "password_hash": "$2b$12$demo_password_hash",  # Not real, can't login
            "role": "user",
            "status": "active",
            "email_verified": True,
            "current_plan": user_data["plan"],
            "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 180))).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "login_count": random.randint(10, 100)
        }
        await db.users.insert_one(user)
        print(f"  Created user: {user_data['name']}")


async def seed_subscriptions():
    """Create demo subscriptions."""
    print("Seeding subscriptions...")
    
    users = await db.users.find({"role": "user", "email": {"$regex": "@demo.com"}}).to_list(100)
    
    for user in users:
        existing = await db.subscriptions.find_one({"user_id": user["id"]})
        if existing:
            continue
            
        plan = user.get("current_plan", "basic")
        prices = {"basic": 49, "pro": 69, "enterprise": 149}
        billing = random.choice(["monthly", "yearly"])
        
        subscription = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "plan": plan,
            "billing_cycle": billing,
            "status": "active",
            "amount": prices.get(plan, 49) * (12 if billing == "yearly" else 1) * (0.6 if billing == "yearly" else 1),
            "currency": "usd",
            "started_at": user["created_at"],
            "created_at": user["created_at"],
            "next_billing_date": (datetime.now(timezone.utc) + timedelta(days=random.randint(1, 30))).isoformat()
        }
        await db.subscriptions.insert_one(subscription)
        print(f"  Created subscription for: {user['name']}")


async def seed_instagram_accounts():
    """Create demo Instagram accounts."""
    print("Seeding Instagram accounts...")
    
    users = await db.users.find({"role": "user", "email": {"$regex": "@demo.com"}}).to_list(100)
    
    usernames = ["sarahmitchell", "marcusjohnson", "elenarodriguez", "davidchen", 
                 "amandafoster", "jameswilson", "lisawang", "michaelbrown"]
    
    niches = ["Fashion & Lifestyle", "Business & Finance", "E-commerce", 
              "Travel", "Food & Cooking", "Fitness", "Tech", "Beauty"]
    
    locations = ["United States", "United Kingdom", "Canada", "Australia", 
                 "Germany", "France", "Spain", "Brazil"]
    
    for i, user in enumerate(users):
        existing = await db.instagram_accounts.find_one({"user_id": user["id"]})
        if existing:
            continue
            
        initial_followers = random.randint(1000, 50000)
        gained = random.randint(5000, 50000)
        
        account = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "username": usernames[i % len(usernames)],
            "status": "active",
            "initial_followers": initial_followers,
            "followers_count": initial_followers + gained,
            "following_count": random.randint(200, 2000),
            "posts_count": random.randint(50, 500),
            "engagement_rate": round(random.uniform(2.5, 8.5), 2),
            "total_followers_gained": gained,
            "followers_this_month": random.randint(1000, 5000),
            "growth_paused": False,
            "connected_at": user["created_at"],
            "created_at": user["created_at"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.instagram_accounts.insert_one(account)
        
        # Create targeting settings
        targeting = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "instagram_account_id": account["id"],
            "niche": niches[i % len(niches)],
            "locations": [locations[i % len(locations)], locations[(i+1) % len(locations)]],
            "hashtags": ["growth", "instagram", niches[i % len(niches)].lower().replace(" ", "")],
            "competitor_accounts": [f"@competitor{j}" for j in range(1, 4)],
            "created_at": user["created_at"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.targeting_settings.insert_one(targeting)
        
        print(f"  Created Instagram account: @{account['username']}")


async def seed_payments():
    """Create demo payment history."""
    print("Seeding payments...")
    
    users = await db.users.find({"role": "user", "email": {"$regex": "@demo.com"}}).to_list(100)
    
    for user in users:
        # Check if already has payments
        existing = await db.payments.find_one({"user_id": user["id"]})
        if existing:
            continue
            
        # Create 1-3 past payments
        num_payments = random.randint(1, 3)
        for j in range(num_payments):
            payment = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "amount": random.choice([49, 69, 149, 348, 492, 1188]),
                "currency": "usd",
                "status": "success",
                "payment_method": "card",
                "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 90))).isoformat()
            }
            await db.payments.insert_one(payment)
        
        print(f"  Created {num_payments} payments for: {user['name']}")


async def seed_funnel_events():
    """Create demo funnel events for analytics."""
    print("Seeding funnel events...")
    
    pages = ["homepage", "pricing", "login", "signup", "dashboard"]
    ctas = ["get_started", "view_plans", "subscribe_basic", "subscribe_pro", "subscribe_enterprise"]
    
    # Generate events for last 30 days
    for day_offset in range(30):
        date = datetime.now(timezone.utc) - timedelta(days=day_offset)
        
        # More events on recent days
        num_events = random.randint(50, 200) if day_offset < 7 else random.randint(20, 100)
        
        for _ in range(num_events):
            event = {
                "id": str(uuid.uuid4()),
                "event_type": random.choice(["page_view", "click"]),
                "page": random.choice(pages) if random.random() > 0.3 else "homepage",
                "event_name": random.choice(ctas) if random.random() > 0.5 else None,
                "created_at": date.isoformat()
            }
            await db.funnel_events.insert_one(event)
    
    print(f"  Created funnel events for 30 days")


async def seed_growth_logs():
    """Create demo growth logs."""
    print("Seeding growth logs...")
    
    accounts = await db.instagram_accounts.find({"status": "active"}).to_list(100)
    
    for account in accounts:
        # Create 20-50 growth logs per account
        num_logs = random.randint(20, 50)
        for j in range(num_logs):
            log = {
                "id": str(uuid.uuid4()),
                "user_id": account["user_id"],
                "instagram_account_id": account["id"],
                "log_type": random.choice(["follower_gained", "engagement", "system"]),
                "message": random.choice([
                    "New follower gained from targeting",
                    "Engagement boost detected",
                    "AI optimization applied",
                    "Growth milestone reached"
                ]),
                "created_at": (datetime.now(timezone.utc) - timedelta(days=random.randint(1, 30))).isoformat()
            }
            await db.growth_logs.insert_one(log)
    
    print(f"  Created growth logs for {len(accounts)} accounts")


async def main():
    """Run all seed functions."""
    print("\n🌱 Starting Adverlyx Demo Data Seeding...\n")
    
    await seed_users()
    await seed_subscriptions()
    await seed_instagram_accounts()
    await seed_payments()
    await seed_funnel_events()
    await seed_growth_logs()
    
    print("\n✅ Demo data seeding complete!\n")
    
    # Print summary
    users_count = await db.users.count_documents({"role": "user"})
    subs_count = await db.subscriptions.count_documents({})
    ig_count = await db.instagram_accounts.count_documents({})
    payments_count = await db.payments.count_documents({})
    events_count = await db.funnel_events.count_documents({})
    
    print("📊 Database Summary:")
    print(f"   Users: {users_count}")
    print(f"   Subscriptions: {subs_count}")
    print(f"   Instagram Accounts: {ig_count}")
    print(f"   Payments: {payments_count}")
    print(f"   Funnel Events: {events_count}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
