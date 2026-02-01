"""
Instagram Growth Engine - Safe Mode
Uses Instagram Graph API for analytics + AI targeting for suggestions
User performs actions manually (no automation)
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Any
import logging
import uuid
import os

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
    daily_target_suggestions: int = 50  # How many accounts to suggest per day
    targeting_accuracy: str = "high"  # low, medium, high
    min_follower_count: int = 100
    max_follower_count: int = 50000
    min_engagement_rate: float = 1.0
    exclude_private_accounts: bool = True
    exclude_business_accounts: bool = False
    niche_keywords: List[str] = []


class TargetingCampaign(BaseModel):
    instagram_username: str
    instagram_user_id: Optional[str] = None
    target_hashtags: List[str] = []
    target_locations: List[str] = []
    competitor_accounts: List[str] = []
    target_niches: List[str] = []
    daily_target: int = 30


class ManualActionLog(BaseModel):
    action_type: str  # follow, like, comment, story_view, dm
    target_username: str
    target_post_id: Optional[str] = None
    notes: Optional[str] = None


# ============== Instagram Graph API Service ==============

class InstagramGraphService:
    """Service for Instagram Graph API - Analytics Only."""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://graph.facebook.com/v18.0"
    
    async def get_account_insights(self, ig_user_id: str, period: str = "day") -> dict:
        """Get account insights from Graph API."""
        import httpx
        
        metrics = "impressions,reach,profile_views,follower_count"
        url = f"{self.base_url}/{ig_user_id}/insights"
        params = {
            "metric": metrics,
            "period": period,
            "access_token": self.access_token
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Graph API error: {response.text}")
                    return {"error": response.text}
        except Exception as e:
            logger.error(f"Graph API request failed: {e}")
            return {"error": str(e)}
    
    async def get_media_insights(self, ig_user_id: str, limit: int = 25) -> dict:
        """Get recent media with engagement data."""
        import httpx
        
        url = f"{self.base_url}/{ig_user_id}/media"
        params = {
            "fields": "id,caption,media_type,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement)",
            "limit": limit,
            "access_token": self.access_token
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    return response.json()
                return {"error": response.text}
        except Exception as e:
            return {"error": str(e)}
    
    async def get_audience_demographics(self, ig_user_id: str) -> dict:
        """Get audience demographics (requires Business/Creator account)."""
        import httpx
        
        url = f"{self.base_url}/{ig_user_id}/insights"
        params = {
            "metric": "audience_city,audience_country,audience_gender_age",
            "period": "lifetime",
            "access_token": self.access_token
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    return response.json()
                return {"error": response.text}
        except Exception as e:
            return {"error": str(e)}
    
    async def search_hashtag(self, hashtag: str, ig_user_id: str) -> dict:
        """Search hashtag for recent media (limited by API)."""
        import httpx
        
        # First get hashtag ID
        url = f"{self.base_url}/ig_hashtag_search"
        params = {
            "user_id": ig_user_id,
            "q": hashtag,
            "access_token": self.access_token
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("data"):
                        hashtag_id = data["data"][0]["id"]
                        # Get recent media for hashtag
                        media_url = f"{self.base_url}/{hashtag_id}/recent_media"
                        media_params = {
                            "user_id": ig_user_id,
                            "fields": "id,caption,media_type,permalink",
                            "access_token": self.access_token
                        }
                        media_response = await client.get(media_url, params=media_params)
                        if media_response.status_code == 200:
                            return media_response.json()
                return {"error": response.text}
        except Exception as e:
            return {"error": str(e)}


# ============== AI Targeting Service ==============

class AITargetingService:
    """AI-powered targeting suggestions - finds accounts for manual engagement."""
    
    def __init__(self):
        self.openai_available = False
        try:
            from emergentintegrations.llm.chat import chat, LlmConfig
            self.chat = chat
            self.LlmConfig = LlmConfig
            self.openai_available = True
        except ImportError:
            logger.warning("OpenAI not available for AI targeting")
    
    async def generate_target_suggestions(
        self,
        campaign: dict,
        existing_targets: list,
        count: int = 20
    ) -> list:
        """Use AI to generate smart targeting suggestions."""
        
        if not self.openai_available:
            return self._generate_basic_suggestions(campaign, count)
        
        try:
            prompt = f"""You are an Instagram growth strategist. Based on the following campaign settings, suggest {count} types of Instagram accounts that would be ideal targets for engagement.

Campaign Details:
- Target Hashtags: {', '.join(campaign.get('target_hashtags', []))}
- Target Niches: {', '.join(campaign.get('target_niches', []))}
- Competitor Accounts: {', '.join(campaign.get('competitor_accounts', []))}
- Target Locations: {', '.join(campaign.get('target_locations', []))}

Generate suggestions in this JSON format:
[
  {{
    "account_type": "description of ideal account type",
    "search_strategy": "how to find these accounts",
    "hashtags_to_explore": ["hashtag1", "hashtag2"],
    "engagement_tip": "best way to engage with this type",
    "priority": "high/medium/low"
  }}
]

Focus on accounts that:
1. Are likely to follow back
2. Are genuinely interested in similar content
3. Have good engagement rates
4. Are active recently

Return ONLY valid JSON array."""

            api_key = os.environ.get("EMERGENT_API_KEY") or os.environ.get("LLM_API_KEY")
            
            response = await self.chat(
                self.LlmConfig(
                    api_key=api_key,
                    model="gpt-4o-mini",
                    system_prompt="You are an Instagram growth strategist. Return only valid JSON."
                ),
                prompt
            )
            
            import json
            suggestions = json.loads(response.message)
            return suggestions
            
        except Exception as e:
            logger.error(f"AI targeting error: {e}")
            return self._generate_basic_suggestions(campaign, count)
    
    def _generate_basic_suggestions(self, campaign: dict, count: int) -> list:
        """Generate basic suggestions without AI."""
        suggestions = []
        
        hashtags = campaign.get("target_hashtags", [])
        niches = campaign.get("target_niches", [])
        competitors = campaign.get("competitor_accounts", [])
        
        # Hashtag-based suggestions
        for hashtag in hashtags[:5]:
            suggestions.append({
                "account_type": f"Users posting with #{hashtag}",
                "search_strategy": f"Search #{hashtag} and engage with recent posts",
                "hashtags_to_explore": [hashtag, f"{hashtag}community", f"{hashtag}life"],
                "engagement_tip": "Like their last 2-3 posts and leave genuine comment",
                "priority": "high"
            })
        
        # Competitor-based suggestions
        for competitor in competitors[:3]:
            suggestions.append({
                "account_type": f"Followers of @{competitor}",
                "search_strategy": f"Check @{competitor}'s followers and recent commenters",
                "hashtags_to_explore": [],
                "engagement_tip": "These users are already interested in your niche",
                "priority": "high"
            })
        
        # Niche-based suggestions
        for niche in niches[:3]:
            suggestions.append({
                "account_type": f"Accounts in {niche} niche",
                "search_strategy": f"Explore {niche} related hashtags and accounts",
                "hashtags_to_explore": [niche.lower().replace(" ", ""), f"{niche.lower().replace(' ', '')}tips"],
                "engagement_tip": f"Connect over shared interest in {niche}",
                "priority": "medium"
            })
        
        return suggestions[:count]
    
    async def analyze_account_quality(self, account_data: dict) -> dict:
        """Analyze if an account is worth engaging with."""
        followers = account_data.get("followers", 0)
        following = account_data.get("following", 0)
        posts = account_data.get("posts", 0)
        
        # Calculate quality metrics
        ratio = followers / following if following > 0 else 0
        posts_per_follower = posts / followers if followers > 0 else 0
        
        quality_score = 50  # Base score
        
        # Follower/following ratio (ideal: 0.5-2.0)
        if 0.5 <= ratio <= 2.0:
            quality_score += 20
        elif ratio > 2.0:
            quality_score += 10
        
        # Has enough posts (shows active account)
        if posts >= 10:
            quality_score += 15
        elif posts >= 5:
            quality_score += 10
        
        # Not too many followers (more likely to engage)
        if 500 <= followers <= 10000:
            quality_score += 15
        elif followers < 500:
            quality_score += 10
        
        return {
            "quality_score": min(quality_score, 100),
            "follow_back_likelihood": "high" if quality_score >= 70 else "medium" if quality_score >= 50 else "low",
            "recommendation": "engage" if quality_score >= 50 else "skip",
            "analysis": {
                "follower_ratio": round(ratio, 2),
                "activity_level": "active" if posts >= 10 else "moderate" if posts >= 5 else "low"
            }
        }


# ============== API Endpoints ==============

# --- Configuration ---

@router.get("/config")
async def get_growth_config(current_user: dict = Depends(get_current_user)):
    """Get growth engine configuration (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await db.growth_engine_config.find_one({"is_active": True}, {"_id": 0})
    
    if not config:
        config = {
            "is_active": True,
            "daily_target_suggestions": 50,
            "targeting_accuracy": "high",
            "min_follower_count": 100,
            "max_follower_count": 50000,
            "min_engagement_rate": 1.0,
            "exclude_private_accounts": True,
            "exclude_business_accounts": False,
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
    
    await db.growth_engine_config.update_many({}, {"$set": {"is_active": False}})
    await db.growth_engine_config.insert_one(config_data)
    
    return {"message": "Growth engine configuration updated"}


# --- Campaigns ---

@router.post("/campaigns/create")
async def create_campaign(
    campaign: TargetingCampaign,
    current_user: dict = Depends(get_current_user)
):
    """Create a new targeting campaign."""
    # Check subscription
    subscription = await db.subscriptions.find_one({
        "user_id": current_user["user_id"],
        "status": "active"
    })
    
    if not subscription:
        raise HTTPException(status_code=403, detail="Active subscription required")
    
    campaign_data = {
        "id": f"campaign_{uuid.uuid4().hex[:16]}",
        "user_id": current_user["user_id"],
        "instagram_username": campaign.instagram_username,
        "instagram_user_id": campaign.instagram_user_id,
        "target_hashtags": campaign.target_hashtags,
        "target_locations": campaign.target_locations,
        "competitor_accounts": campaign.competitor_accounts,
        "target_niches": campaign.target_niches,
        "daily_target": campaign.daily_target,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "total_suggestions_generated": 0,
            "manual_follows": 0,
            "manual_likes": 0,
            "manual_comments": 0,
            "followers_gained": 0
        }
    }
    
    await db.growth_campaigns.insert_one(campaign_data)
    
    return {
        "campaign_id": campaign_data["id"],
        "message": "Campaign created successfully"
    }


@router.get("/campaigns")
async def get_user_campaigns(current_user: dict = Depends(get_current_user)):
    """Get user's campaigns."""
    campaigns = await db.growth_campaigns.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"campaigns": campaigns}


@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Get campaign details."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return campaign


@router.post("/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Pause a campaign."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.growth_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "paused", "paused_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"status": "paused"}


@router.post("/campaigns/{campaign_id}/resume")
async def resume_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    """Resume a paused campaign."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.growth_campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"status": "active", "resumed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"status": "active"}


# --- AI Target Suggestions ---

@router.get("/campaigns/{campaign_id}/suggestions")
async def get_target_suggestions(
    campaign_id: str,
    count: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get AI-powered target suggestions for manual engagement."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get existing targets to avoid duplicates
    existing = await db.target_suggestions.find(
        {"campaign_id": campaign_id},
        {"account_type": 1}
    ).to_list(100)
    
    ai_service = AITargetingService()
    suggestions = await ai_service.generate_target_suggestions(
        campaign,
        existing,
        count
    )
    
    # Store suggestions
    for suggestion in suggestions:
        suggestion["campaign_id"] = campaign_id
        suggestion["user_id"] = current_user["user_id"]
        suggestion["generated_at"] = datetime.now(timezone.utc).isoformat()
        suggestion["status"] = "pending"  # pending, actioned, skipped
        await db.target_suggestions.insert_one(suggestion)
    
    # Update campaign stats
    await db.growth_campaigns.update_one(
        {"id": campaign_id},
        {"$inc": {"stats.total_suggestions_generated": len(suggestions)}}
    )
    
    return {
        "suggestions": suggestions,
        "count": len(suggestions),
        "message": "These are AI-generated suggestions. Engage with these accounts manually for best results."
    }


@router.post("/campaigns/{campaign_id}/suggestions/{suggestion_id}/action")
async def mark_suggestion_actioned(
    campaign_id: str,
    suggestion_id: str,
    action: str,  # actioned, skipped
    current_user: dict = Depends(get_current_user)
):
    """Mark a suggestion as actioned or skipped."""
    await db.target_suggestions.update_one(
        {"_id": suggestion_id, "campaign_id": campaign_id},
        {"$set": {
            "status": action,
            "actioned_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": f"Suggestion marked as {action}"}


# --- Manual Action Logging ---

@router.post("/campaigns/{campaign_id}/log-action")
async def log_manual_action(
    campaign_id: str,
    action: ManualActionLog,
    current_user: dict = Depends(get_current_user)
):
    """Log a manual action (follow, like, comment, etc.)."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    action_log = {
        "id": f"action_{uuid.uuid4().hex[:12]}",
        "campaign_id": campaign_id,
        "user_id": current_user["user_id"],
        "action_type": action.action_type,
        "target_username": action.target_username,
        "target_post_id": action.target_post_id,
        "notes": action.notes,
        "logged_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.manual_actions.insert_one(action_log)
    
    # Update campaign stats
    stat_field = f"stats.manual_{action.action_type}s"
    await db.growth_campaigns.update_one(
        {"id": campaign_id},
        {"$inc": {stat_field: 1}}
    )
    
    return {"message": "Action logged", "action_id": action_log["id"]}


@router.get("/campaigns/{campaign_id}/action-history")
async def get_action_history(
    campaign_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get manual action history for a campaign."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if campaign["user_id"] != current_user["user_id"] and not is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    
    actions = await db.manual_actions.find(
        {"campaign_id": campaign_id},
        {"_id": 0}
    ).sort("logged_at", -1).limit(limit).to_list(limit)
    
    return {"actions": actions}


# --- Instagram Analytics (Graph API) ---

@router.get("/analytics/{campaign_id}")
async def get_instagram_analytics(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get Instagram analytics using Graph API."""
    campaign = await db.growth_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get Instagram connection
    ig_connection = await db.instagram_connections.find_one({
        "user_id": current_user["user_id"],
        "username": campaign["instagram_username"]
    }, {"_id": 0})
    
    if not ig_connection or not ig_connection.get("access_token"):
        return {
            "connected": False,
            "message": "Instagram account not connected via Graph API. Connect in dashboard to see real analytics."
        }
    
    service = InstagramGraphService(ig_connection["access_token"])
    ig_user_id = ig_connection.get("instagram_user_id")
    
    if not ig_user_id:
        return {"connected": False, "message": "Instagram User ID not available"}
    
    # Fetch analytics
    insights = await service.get_account_insights(ig_user_id)
    media = await service.get_media_insights(ig_user_id)
    demographics = await service.get_audience_demographics(ig_user_id)
    
    return {
        "connected": True,
        "account": campaign["instagram_username"],
        "insights": insights,
        "recent_media": media,
        "demographics": demographics
    }


# --- Admin Endpoints ---

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
    
    for campaign in campaigns:
        user = await db.users.find_one({"id": campaign["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        campaign["user"] = user
    
    return {
        "campaigns": campaigns,
        "total": await db.growth_campaigns.count_documents(query)
    }


@router.get("/admin/stats")
async def get_engine_stats(current_user: dict = Depends(get_current_user)):
    """Get overall engine statistics (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_campaigns = await db.growth_campaigns.count_documents({})
    active_campaigns = await db.growth_campaigns.count_documents({"status": "active"})
    paused_campaigns = await db.growth_campaigns.count_documents({"status": "paused"})
    
    total_suggestions = await db.target_suggestions.count_documents({})
    total_manual_actions = await db.manual_actions.count_documents({})
    
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_actions = await db.manual_actions.count_documents({
        "logged_at": {"$gte": today.isoformat()}
    })
    
    return {
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "paused_campaigns": paused_campaigns,
        "total_suggestions": total_suggestions,
        "total_manual_actions": total_manual_actions,
        "today_manual_actions": today_actions
    }
