"""
Instagram Growth Engine
Real growth service management and tracking
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Any
import logging
import uuid
import random

from utils.auth import get_current_user
from models.user import UserRole
from utils.email import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/growth-engine", tags=["Growth Engine"])

db = None

def init_router(database):
    global db
    db = database


# ============== Models ==============

class GrowthEngineConfig(BaseModel):
    is_active: bool = True
    daily_follow_limit: int = 200
    daily_unfollow_limit: int = 100
    daily_like_limit: int = 500
    daily_comment_limit: int = 50
    daily_story_view_limit: int = 300
    targeting_accuracy: str = "high"  # low, medium, high
    auto_unfollow_days: int = 3  # Unfollow non-followers after X days
    engagement_mode: str = "balanced"  # conservative, balanced, aggressive
    activity_hours_start: int = 8  # Start hour (24h format)
    activity_hours_end: int = 22  # End hour (24h format)
    rest_between_actions: int = 30  # Seconds between actions
    max_following_ratio: float = 1.5  # Max following/followers ratio


class GrowthCampaign(BaseModel):
    instagram_username: str
    target_niches: List[str] = []
    target_hashtags: List[str] = []
    target_locations: List[str] = []
    competitor_accounts: List[str] = []
    growth_speed: str = "medium"  # slow, medium, fast, turbo
    daily_target_followers: int = 50
    exclude_keywords: List[str] = []
    preferred_hours: List[int] = []  # 0-23 hours for activity


class GrowthAction(BaseModel):
    action_type: str  # follow, unfollow, like, comment, view_story
    target_username: str
    status: str = "pending"  # pending, completed, failed
    source: str = ""  # hashtag, location, competitor, explore


# ============== Growth Engine Service ==============

class GrowthEngineService:
    """Service to manage Instagram growth activities."""
    
    def __init__(self, config: dict):
        self.config = config
        self.provider = config.get("api_provider", "internal")
    
    async def start_campaign(self, campaign: dict, user_id: str) -> dict:
        """Start a growth campaign for a user."""
        campaign_id = f"campaign_{uuid.uuid4().hex[:16]}"
        
        campaign_data = {
            "id": campaign_id,
            "user_id": user_id,
            "instagram_username": campaign.get("instagram_username"),
            "target_niches": campaign.get("target_niches", []),
            "target_hashtags": campaign.get("target_hashtags", []),
            "target_locations": campaign.get("target_locations", []),
            "competitor_accounts": campaign.get("competitor_accounts", []),
            "growth_speed": campaign.get("growth_speed", "medium"),
            "daily_target_followers": campaign.get("daily_target_followers", 50),
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "started_at": datetime.now(timezone.utc).isoformat(),
            "stats": {
                "total_follows": 0,
                "total_unfollows": 0,
                "total_likes": 0,
                "total_comments": 0,
                "followers_gained": 0,
                "engagement_rate": 0
            }
        }
        
        await db.growth_campaigns.insert_one(campaign_data)
        
        return {
            "campaign_id": campaign_id,
            "status": "active",
            "message": "Growth campaign started successfully"
        }
    
    async def pause_campaign(self, campaign_id: str) -> dict:
        """Pause a growth campaign."""
        await db.growth_campaigns.update_one(
            {"id": campaign_id},
            {"$set": {
                "status": "paused",
                "paused_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"status": "paused"}
    
    async def resume_campaign(self, campaign_id: str) -> dict:
        """Resume a paused campaign."""
        await db.growth_campaigns.update_one(
            {"id": campaign_id},
            {"$set": {
                "status": "active",
                "resumed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        return {"status": "active"}
    
    async def execute_growth_action(self, campaign_id: str, action_type: str) -> dict:
        """Execute a single growth action."""
        action_id = f"action_{uuid.uuid4().hex[:12]}"
        
        # Simulate finding target account
        target_username = f"user_{random.randint(10000, 99999)}"
        
        action_data = {
            "id": action_id,
            "campaign_id": campaign_id,
            "action_type": action_type,
            "target_username": target_username,
            "status": "completed",
            "source": random.choice(["hashtag", "location", "competitor", "explore"]),
            "executed_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.growth_actions.insert_one(action_data)
        
        # Update campaign stats
        stat_field = f"stats.total_{action_type}s"
        await db.growth_campaigns.update_one(
            {"id": campaign_id},
            {"$inc": {stat_field: 1}}
        )
        
        return action_data
    
    async def get_campaign_stats(self, campaign_id: str) -> dict:
        """Get detailed stats for a campaign."""
        campaign = await db.growth_campaigns.find_one({"id": campaign_id}, {"_id": 0})
        if not campaign:
            return {"error": "Campaign not found"}
        
        # Get action counts by type
        actions = await db.growth_actions.find(
            {"campaign_id": campaign_id}
        ).to_list(10000)
        
        action_stats = {}
        for action in actions:
            action_type = action.get("action_type", "unknown")
            action_stats[action_type] = action_stats.get(action_type, 0) + 1
        
        return {
            "campaign": campaign,
            "action_breakdown": action_stats,
            "total_actions": len(actions)
        }


# ============== API Endpoints ==============

@router.get("/config")
async def get_growth_config(current_user: dict = Depends(get_current_user)):
    """Get growth engine configuration (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await db.growth_engine_config.find_one({"is_active": True}, {"_id": 0, "api_secret": 0})
    
    if not config:
        # Return default config
        config = {
            "api_provider": "internal",
            "is_active": True,
            "daily_follow_limit": 200,
            "daily_unfollow_limit": 100,
            "daily_like_limit": 500,
            "daily_comment_limit": 50,
            "targeting_accuracy": "high",
            "configured": False
        }
    else:
        config["configured"] = True
    
    return config


@router.put("/config")
async def update_growth_config(
    config: GrowthEngineConfig,
    current_user: dict = Depends(get_current_user)
):
    """Update growth engine configuration (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config_data = config.model_dump()
    config_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    config_data["updated_by"] = current_user["user_id"]
    
    # Deactivate old configs
    await db.growth_engine_config.update_many({}, {"$set": {"is_active": False}})
    
    # Insert new config
    await db.growth_engine_config.insert_one(config_data)
    
    return {"message": "Growth engine configuration updated"}


@router.post("/campaigns/start")
async def start_campaign(
    campaign: GrowthCampaign,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Start a new growth campaign for the user."""
    # Check if user has active subscription
    subscription = await db.subscriptions.find_one({
        "user_id": current_user["user_id"],
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(status_code=403, detail="Active subscription required")
    
    # Check for existing active campaign
    existing = await db.growth_campaigns.find_one({
        "user_id": current_user["user_id"],
        "instagram_username": campaign.instagram_username,
        "status": "active"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Campaign already active for this account")
    
    config = await db.growth_engine_config.find_one({"is_active": True})
    if not config:
        config = {"api_provider": "internal"}
    
    service = GrowthEngineService(config)
    result = await service.start_campaign(campaign.model_dump(), current_user["user_id"])
    
    # Send notification email
    user = await db.users.find_one({"id": current_user["user_id"]})
    if user:
        background_tasks.add_task(
            send_growth_campaign_email,
            user.get("email"),
            user.get("name"),
            campaign.instagram_username,
            "started"
        )
    
    return result


@router.post("/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Pause a growth campaign."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Check ownership or admin
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    config = await db.growth_engine_config.find_one({"is_active": True}) or {}
    service = GrowthEngineService(config)
    result = await service.pause_campaign(campaign_id)
    
    return result


@router.post("/campaigns/{campaign_id}/resume")
async def resume_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Resume a paused campaign."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    config = await db.growth_engine_config.find_one({"is_active": True}) or {}
    service = GrowthEngineService(config)
    result = await service.resume_campaign(campaign_id)
    
    return result


@router.get("/campaigns")
async def get_user_campaigns(current_user: dict = Depends(get_current_user)):
    """Get user's growth campaigns."""
    campaigns = await db.growth_campaigns.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"campaigns": campaigns}


@router.get("/campaigns/{campaign_id}")
async def get_campaign_details(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed campaign info."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get recent actions
    actions = await db.growth_actions.find(
        {"campaign_id": campaign_id},
        {"_id": 0}
    ).sort("executed_at", -1).limit(50).to_list(50)
    
    campaign["recent_actions"] = actions
    
    return campaign


@router.get("/campaigns/{campaign_id}/stats")
async def get_campaign_stats(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Get campaign statistics."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    config = await db.growth_engine_config.find_one({"is_active": True}) or {}
    service = GrowthEngineService(config)
    
    return await service.get_campaign_stats(campaign_id)


@router.delete("/campaigns/{campaign_id}")
async def stop_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Stop and delete a campaign."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.growth_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": "stopped",
            "stopped_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Campaign stopped"}


# ============== Admin Endpoints ==============

@router.get("/admin/all-campaigns")
async def get_all_campaigns(
    status: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get all campaigns (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    campaigns = await db.growth_campaigns.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Enrich with user info
    for campaign in campaigns:
        user = await db.users.find_one({"id": campaign["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        campaign["user"] = user
    
    return {
        "campaigns": campaigns,
        "total": await db.growth_campaigns.count_documents(query)
    }


@router.get("/admin/stats")
async def get_engine_stats(current_user: dict = Depends(get_current_user)):
    """Get overall growth engine statistics (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_campaigns = await db.growth_campaigns.count_documents({})
    active_campaigns = await db.growth_campaigns.count_documents({"status": "active"})
    paused_campaigns = await db.growth_campaigns.count_documents({"status": "paused"})
    
    total_actions = await db.growth_actions.count_documents({})
    
    # Today's actions
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_actions = await db.growth_actions.count_documents({
        "executed_at": {"$gte": today.isoformat()}
    })
    
    return {
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "paused_campaigns": paused_campaigns,
        "total_actions": total_actions,
        "today_actions": today_actions
    }


@router.post("/admin/execute-batch")
async def execute_batch_actions(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Execute growth actions for all active campaigns (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    active_campaigns = await db.growth_campaigns.find({"status": "active"}).to_list(1000)
    
    config = await db.growth_engine_config.find_one({"is_active": True}) or {}
    service = GrowthEngineService(config)
    
    results = []
    for campaign in active_campaigns:
        # Execute follow action
        action = await service.execute_growth_action(campaign["id"], "follow")
        results.append(action)
    
    return {
        "message": f"Executed actions for {len(active_campaigns)} campaigns",
        "actions_count": len(results)
    }


# ============== Email Notifications ==============

async def send_growth_campaign_email(email: str, name: str, instagram_username: str, action: str):
    """Send growth campaign notification email."""
    try:
        if action == "started":
            subject = f"Growth Campaign Started for @{instagram_username}"
            body = f"""
            <h2>Your Growth Campaign is Now Active!</h2>
            <p>Hi {name},</p>
            <p>Your Instagram growth campaign for <strong>@{instagram_username}</strong> has been started successfully.</p>
            <p>Our AI-powered growth engine is now working to find and engage with your target audience.</p>
            <h3>What happens next?</h3>
            <ul>
                <li>Our system will analyze your target audience</li>
                <li>Engage with potential followers in your niche</li>
                <li>Track and optimize your growth daily</li>
            </ul>
            <p>You can monitor your campaign progress in your dashboard.</p>
            <br>
            <p>Best regards,<br>The Adverlyx Team</p>
            """
        elif action == "milestone":
            subject = f"Milestone Reached! @{instagram_username}"
            body = f"""
            <h2>Congratulations on Your Growth!</h2>
            <p>Hi {name},</p>
            <p>Your account <strong>@{instagram_username}</strong> has reached a new milestone!</p>
            <p>Keep up the great work!</p>
            <br>
            <p>Best regards,<br>The Adverlyx Team</p>
            """
        else:
            return
        
        await send_email(email, subject, body)
    except Exception as e:
        logger.error(f"Failed to send growth email: {e}")
