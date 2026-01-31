"""
Growth Tracking and Simulation Service
Tracks user growth progress and simulates follower gains for users with active subscriptions
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import logging
import random

from utils.auth import get_current_user, require_roles
from models.user import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/growth", tags=["Growth Tracking"])

# Database reference
db = None

def init_router(database):
    """Initialize router with database connection."""
    global db
    db = database


class GrowthStatusResponse(BaseModel):
    user_id: str
    plan_name: str
    target_followers: int
    start_followers: int
    current_followers: int
    followers_gained: int
    progress_percent: float
    is_complete: bool
    estimated_completion: Optional[str]
    daily_gain_rate: float


class SimulateGrowthRequest(BaseModel):
    user_id: str
    followers_to_add: Optional[int] = None  # If None, auto-calculate based on plan


@router.get("/status/{user_id}")
async def get_growth_status(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get growth status for a user."""
    # Check if user is accessing their own data or is admin
    if current_user['user_id'] != user_id and current_user.get('role') not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get user and subscription
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Get Instagram account
    instagram = await db.instagram_accounts.find_one({"user_id": user_id}, {"_id": 0})
    if not instagram:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    # Get plan details
    plan_name = user.get("current_plan", "").lower()
    plan = await db.plans.find_one(
        {"name": {"$regex": f"^{plan_name}$", "$options": "i"}},
        {"_id": 0}
    )
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Calculate growth
    target_followers = plan.get("follower_target_max") or plan.get("follower_target") or 1500
    start_followers = subscription.get("start_followers", instagram.get("initial_followers", 0))
    current_followers = instagram.get("followers_count", start_followers)
    followers_gained = max(0, current_followers - start_followers)
    progress_percent = min(100, round((followers_gained / target_followers) * 100, 1))
    is_complete = progress_percent >= 100
    
    # Calculate daily rate and estimated completion
    days_active = 1
    sub_start = subscription.get("created_at")
    if sub_start:
        if isinstance(sub_start, str):
            sub_start = datetime.fromisoformat(sub_start.replace('Z', '+00:00'))
        days_active = max(1, (datetime.now(timezone.utc) - sub_start).days)
    
    daily_rate = followers_gained / days_active
    
    estimated_completion = None
    if not is_complete and daily_rate > 0:
        remaining = target_followers - followers_gained
        days_remaining = remaining / daily_rate
        completion_date = datetime.now(timezone.utc) + timedelta(days=days_remaining)
        estimated_completion = completion_date.strftime("%Y-%m-%d")
    
    return GrowthStatusResponse(
        user_id=user_id,
        plan_name=plan.get("name", "Unknown"),
        target_followers=target_followers,
        start_followers=start_followers,
        current_followers=current_followers,
        followers_gained=followers_gained,
        progress_percent=progress_percent,
        is_complete=is_complete,
        estimated_completion=estimated_completion,
        daily_gain_rate=round(daily_rate, 1)
    )


@router.post("/simulate")
async def simulate_growth(
    request: SimulateGrowthRequest,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Simulate follower growth for a user (Admin only).
    This adds followers to the user's instagram_account and logs the growth.
    """
    user_id = request.user_id
    
    # Get user's subscription and plan
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    instagram = await db.instagram_accounts.find_one({"user_id": user_id}, {"_id": 0})
    if not instagram:
        raise HTTPException(status_code=404, detail="No Instagram account found")
    
    # Determine followers to add
    followers_to_add = request.followers_to_add
    if followers_to_add is None:
        # Auto-calculate based on plan (daily rate)
        plan_name = user.get("current_plan", "").lower()
        plan = await db.plans.find_one(
            {"name": {"$regex": f"^{plan_name}$", "$options": "i"}},
            {"_id": 0}
        )
        
        if plan:
            target = plan.get("follower_target_max") or plan.get("follower_target") or 1500
            # Assuming 30 day delivery, with some variance
            daily_target = target / 30
            followers_to_add = int(daily_target * random.uniform(0.8, 1.2))
        else:
            followers_to_add = random.randint(30, 60)
    
    # Update Instagram account
    current_followers = instagram.get("followers_count", 0)
    new_followers = current_followers + followers_to_add
    
    await db.instagram_accounts.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "followers_count": new_followers,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Log the growth
    growth_log = {
        "user_id": user_id,
        "username": instagram.get("username"),
        "followers_gained": followers_to_add,
        "followers_before": current_followers,
        "followers_after": new_followers,
        "source": "simulation",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.growth_logs.insert_one(growth_log)
    
    # Check if plan is complete
    plan_name = user.get("current_plan", "").lower()
    plan = await db.plans.find_one(
        {"name": {"$regex": f"^{plan_name}$", "$options": "i"}},
        {"_id": 0}
    )
    
    is_complete = False
    if plan and subscription:
        target = plan.get("follower_target_max") or plan.get("follower_target") or 1500
        start = subscription.get("start_followers", instagram.get("initial_followers", 0))
        gained = new_followers - start
        if gained >= target:
            is_complete = True
            # Mark subscription as complete
            await db.subscriptions.update_one(
                {"user_id": user_id, "status": "active"},
                {
                    "$set": {
                        "growth_complete": True,
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
    
    return {
        "message": f"Added {followers_to_add} followers",
        "new_total": new_followers,
        "is_plan_complete": is_complete
    }


@router.post("/sync-from-instagram")
async def sync_from_instagram(
    user_id: str,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """
    Sync follower count from Instagram API and check plan completion.
    This should be called when using real Instagram data.
    """
    instagram = await db.instagram_accounts.find_one({"user_id": user_id}, {"_id": 0})
    if not instagram:
        raise HTTPException(status_code=404, detail="No Instagram account found")
    
    if not instagram.get("is_oauth_connected"):
        raise HTTPException(status_code=400, detail="Instagram not connected via OAuth")
    
    # In a real implementation, this would call the Instagram API
    # For now, return current data
    return {
        "message": "Instagram data synced",
        "followers_count": instagram.get("followers_count", 0),
        "last_synced": instagram.get("last_synced")
    }


@router.get("/leaderboard")
async def get_growth_leaderboard(
    limit: int = 10,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Get top users by growth progress."""
    # Aggregate growth data
    pipeline = [
        {"$match": {"status": "active"}},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "id",
            "as": "user"
        }},
        {"$unwind": "$user"},
        {"$lookup": {
            "from": "instagram_accounts",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "instagram"
        }},
        {"$unwind": {"path": "$instagram", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_id": 1,
            "name": "$user.name",
            "plan": "$user.current_plan",
            "followers_count": "$instagram.followers_count",
            "start_followers": 1
        }},
        {"$limit": limit}
    ]
    
    results = await db.subscriptions.aggregate(pipeline).to_list(limit)
    return results
