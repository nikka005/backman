from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel

from models.instagram_account import (
    InstagramAccount, InstagramAccountCreate, InstagramAccountUpdate,
    GrowthIntensity, AccountStatus
)
from models.targeting import TargetingSettings, TargetingSettingsCreate, TargetingSettingsUpdate
from models.growth_log import GrowthLog, GrowthLogCreate, GrowthLogType
from utils.auth import get_current_user

router = APIRouter(prefix="/instagram", tags=["Instagram"])

db = None

def init_router(database):
    global db
    db = database


class InstagramStatsResponse(BaseModel):
    followers_count: int
    following_count: int
    posts_count: int
    engagement_rate: float
    total_followers_gained: int
    followers_this_month: int
    followers_this_week: int = 0
    followers_gained_today: int = 0
    growth_percentage: float
    reach_today: int = 0
    reach_this_week: int = 0
    profile_visits_today: int = 0
    profile_visits_this_week: int = 0
    impressions_today: int = 0
    impressions_this_week: int = 0
    website_clicks_today: int = 0
    website_clicks_this_week: int = 0


class FixAccountDataRequest(BaseModel):
    username: str
    initial_followers: Optional[int] = None
    followers_this_month: Optional[int] = None
    followers_this_week: Optional[int] = None
    followers_gained_today: Optional[int] = None
    reach_today: Optional[int] = None
    profile_visits_today: Optional[int] = None
    impressions_today: Optional[int] = None
    website_clicks_today: Optional[int] = None
    auto_calculate: bool = True  # Auto-calculate weekly values from daily


@router.post("/admin/fix-account-data")
async def fix_account_data(
    data: FixAccountDataRequest,
    current_user: dict = Depends(get_current_user)
):
    """Admin endpoint to fix Instagram account growth data."""
    # Check if user is admin
    if current_user.get("role") not in ["admin", "ADMIN", "manager"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Find the account
    username_clean = data.username.lower().replace("@", "").strip()
    account = await db.instagram_accounts.find_one({
        "username": {"$regex": f"^{username_clean}$", "$options": "i"}
    })
    
    if not account:
        raise HTTPException(status_code=404, detail=f"Account @{username_clean} not found")
    
    current_followers = account.get("followers_count", 0)
    
    # Build update object
    update_data = {}
    
    # Set initial followers if provided
    if data.initial_followers is not None:
        update_data["initial_followers"] = data.initial_followers
        # Recalculate total gained
        update_data["total_followers_gained"] = current_followers - data.initial_followers
    
    # Set monthly data
    if data.followers_this_month is not None:
        update_data["followers_this_month"] = data.followers_this_month
        update_data["followers_gained_this_month"] = data.followers_this_month
    
    # Set weekly data
    if data.followers_this_week is not None:
        update_data["followers_this_week"] = data.followers_this_week
        update_data["followers_gained_this_week"] = data.followers_this_week
    
    # Set daily data
    if data.followers_gained_today is not None:
        update_data["followers_gained_today"] = data.followers_gained_today
    
    # Set reach data
    if data.reach_today is not None:
        update_data["reach_today"] = data.reach_today
        if data.auto_calculate:
            update_data["reach_this_week"] = data.reach_today * 7
    
    # Set profile visits
    if data.profile_visits_today is not None:
        update_data["profile_visits_today"] = data.profile_visits_today
        if data.auto_calculate:
            update_data["profile_visits_this_week"] = data.profile_visits_today * 7
    
    # Set impressions
    if data.impressions_today is not None:
        update_data["impressions_today"] = data.impressions_today
        if data.auto_calculate:
            update_data["impressions_this_week"] = data.impressions_today * 7
    
    # Set website clicks
    if data.website_clicks_today is not None:
        update_data["website_clicks_today"] = data.website_clicks_today
        if data.auto_calculate:
            update_data["website_clicks_this_week"] = data.website_clicks_today * 7
    
    if not update_data:
        return {"message": "No data to update", "account": username_clean}
    
    # Update the account
    await db.instagram_accounts.update_one(
        {"_id": account["_id"]},
        {"$set": update_data}
    )
    
    return {
        "message": f"Account @{username_clean} data updated successfully",
        "updated_fields": list(update_data.keys()),
        "new_values": update_data
    }


@router.post("/admin/recalculate-all-growth")
async def recalculate_all_growth(current_user: dict = Depends(get_current_user)):
    """Admin endpoint to recalculate growth data for all accounts."""
    # Check if user is admin
    if current_user.get("role") not in ["admin", "ADMIN", "manager"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    accounts = await db.instagram_accounts.find({}).to_list(1000)
    updated_count = 0
    
    for account in accounts:
        current_followers = account.get("followers_count", 0)
        initial_followers = account.get("initial_followers", 0)
        
        # If initial_followers is 0 but we have followers, estimate initial
        if initial_followers == 0 and current_followers > 0:
            # Estimate initial as 95% of current (assuming ~5% growth)
            initial_followers = int(current_followers * 0.95)
        
        total_gained = max(0, current_followers - initial_followers)
        
        # Estimate monthly/weekly/daily if not set
        update_data = {
            "initial_followers": initial_followers,
            "total_followers_gained": total_gained,
        }
        
        # Only set these if they're currently 0
        if account.get("followers_this_month", 0) == 0 and total_gained > 0:
            update_data["followers_this_month"] = max(1, int(total_gained * 0.3))
            update_data["followers_gained_this_month"] = update_data["followers_this_month"]
        
        if account.get("followers_this_week", 0) == 0:
            monthly = update_data.get("followers_this_month", account.get("followers_this_month", 0))
            update_data["followers_this_week"] = max(1, int(monthly * 0.25))
            update_data["followers_gained_this_week"] = update_data["followers_this_week"]
        
        if account.get("followers_gained_today", 0) == 0:
            weekly = update_data.get("followers_this_week", account.get("followers_this_week", 0))
            update_data["followers_gained_today"] = max(0, int(weekly * 0.15))
        
        # Set default reach/visits if 0
        if account.get("reach_today", 0) == 0:
            update_data["reach_today"] = max(50, current_followers * 2)
            update_data["reach_this_week"] = update_data["reach_today"] * 7
        
        if account.get("profile_visits_today", 0) == 0:
            update_data["profile_visits_today"] = max(10, int(current_followers * 0.2))
            update_data["profile_visits_this_week"] = update_data["profile_visits_today"] * 7
        
        if account.get("impressions_today", 0) == 0:
            update_data["impressions_today"] = max(100, current_followers * 5)
            update_data["impressions_this_week"] = update_data["impressions_today"] * 7
        
        if account.get("website_clicks_today", 0) == 0:
            update_data["website_clicks_today"] = max(1, int(current_followers * 0.05))
            update_data["website_clicks_this_week"] = update_data["website_clicks_today"] * 7
        
        await db.instagram_accounts.update_one(
            {"_id": account["_id"]},
            {"$set": update_data}
        )
        updated_count += 1
    
    return {
        "message": f"Recalculated growth data for {updated_count} accounts",
        "accounts_updated": updated_count
    }


@router.post("/connect", response_model=InstagramAccount)
async def connect_instagram(account_data: InstagramAccountCreate, current_user: dict = Depends(get_current_user)):
    """Connect an Instagram account."""
    # Check if user already has an account connected
    existing = await db.instagram_accounts.find_one({
        "user_id": current_user['user_id'],
        "status": {"$ne": AccountStatus.DISCONNECTED}
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an Instagram account connected. Please disconnect it first."
        )
    
    # Check if username is already used by another user
    username_clean = account_data.username.lower().replace("@", "").strip()
    username_exists = await db.instagram_accounts.find_one({
        "username": username_clean,
        "status": {"$ne": AccountStatus.DISCONNECTED}
    })
    
    if username_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This Instagram username is already connected to another account."
        )
    
    # Generate realistic Instagram stats based on username
    # Uses consistent seeding so same username = same stats
    import hashlib
    import random
    
    # Seed random with username for consistency
    seed = int(hashlib.sha256(username_clean.encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)
    
    # Determine account tier based on username characteristics
    username_len = len(username_clean)
    has_numbers = any(c.isdigit() for c in username_clean)
    
    # Account tier affects follower range
    if username_len <= 8 and not has_numbers:
        # Premium username - likely more followers
        base_followers = rng.randint(10000, 100000)
        engagement_base = 4.5
    elif username_len <= 12:
        # Standard username
        base_followers = rng.randint(1000, 30000)
        engagement_base = 3.5
    else:
        # Longer username - typically newer account
        base_followers = rng.randint(200, 5000)
        engagement_base = 5.0  # Smaller accounts often have higher engagement
    
    # Add some variance
    followers = base_followers + rng.randint(-base_followers//10, base_followers//10)
    following = int(followers * rng.uniform(0.1, 0.5)) + rng.randint(100, 800)
    posts = rng.randint(max(10, followers // 500), max(50, followers // 100))
    engagement = round(engagement_base + rng.uniform(-1.5, 2.0), 2)
    engagement = max(1.5, min(12.0, engagement))  # Cap between 1.5% and 12%
    
    # Generate profile picture URL (using UI Avatars service)
    profile_pic_url = f"https://ui-avatars.com/api/?name={username_clean}&size=150&background=E1306C&color=fff&bold=true"
    
    # Generate a display name from username
    display_name = username_clean.replace('_', ' ').replace('.', ' ').title()
    
    # Create account with generated stats
    account = InstagramAccount(
        user_id=current_user['user_id'],
        username=username_clean,
        name=display_name,
        profile_picture_url=profile_pic_url,
        risk_disclaimer_accepted=account_data.risk_disclaimer_accepted,
        disclaimer_accepted_at=datetime.now(timezone.utc) if account_data.risk_disclaimer_accepted else None,
        followers_count=followers,
        following_count=following,
        posts_count=posts,
        engagement_rate=engagement,
        # Initial growth tracking
        followers_gained_today=0,
        followers_gained_this_week=0,
        followers_gained_this_month=0,
        last_sync=datetime.now(timezone.utc)
    )
    
    # Save to database
    account_dict = account.model_dump()
    for key in ['connected_at', 'created_at', 'updated_at', 'disclaimer_accepted_at', 'last_sync']:
        if account_dict.get(key):
            account_dict[key] = account_dict[key].isoformat()
    
    await db.instagram_accounts.insert_one(account_dict)
    
    # Create default targeting settings
    targeting = TargetingSettings(
        user_id=current_user['user_id'],
        instagram_account_id=account.id
    )
    targeting_dict = targeting.model_dump()
    targeting_dict['created_at'] = targeting_dict['created_at'].isoformat()
    targeting_dict['updated_at'] = targeting_dict['updated_at'].isoformat()
    await db.targeting_settings.insert_one(targeting_dict)
    
    # Log the connection
    log = GrowthLog(
        user_id=current_user['user_id'],
        instagram_account_id=account.id,
        log_type=GrowthLogType.SYSTEM,
        message=f"Instagram account @{account.username} connected"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.growth_logs.insert_one(log_dict)
    
    return account


@router.get("/account", response_model=Optional[InstagramAccount])
async def get_instagram_account(current_user: dict = Depends(get_current_user)):
    """Get connected Instagram account."""
    account_doc = await db.instagram_accounts.find_one({
        "user_id": current_user['user_id'],
        "status": {"$ne": AccountStatus.DISCONNECTED}
    }, {"_id": 0})
    
    if not account_doc:
        return None
    
    return InstagramAccount(**account_doc)


@router.put("/account", response_model=InstagramAccount)
async def update_instagram_account(update_data: InstagramAccountUpdate, current_user: dict = Depends(get_current_user)):
    """Update Instagram account settings."""
    account_doc = await db.instagram_accounts.find_one({
        "user_id": current_user['user_id'],
        "status": {"$ne": AccountStatus.DISCONNECTED}
    })
    
    if not account_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Instagram account connected"
        )
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.instagram_accounts.update_one(
        {"id": account_doc['id']},
        {"$set": update_dict}
    )
    
    # Log the change
    if 'growth_paused' in update_dict:
        action = "paused" if update_dict['growth_paused'] else "resumed"
        log = GrowthLog(
            user_id=current_user['user_id'],
            instagram_account_id=account_doc['id'],
            log_type=GrowthLogType.SYSTEM,
            message=f"Growth {action} by user"
        )
        log_dict = log.model_dump()
        log_dict['created_at'] = log_dict['created_at'].isoformat()
        await db.growth_logs.insert_one(log_dict)
    
    updated_doc = await db.instagram_accounts.find_one({"id": account_doc['id']}, {"_id": 0})
    return InstagramAccount(**updated_doc)


@router.delete("/account")
async def disconnect_instagram(current_user: dict = Depends(get_current_user)):
    """Disconnect Instagram account."""
    account_doc = await db.instagram_accounts.find_one({
        "user_id": current_user['user_id'],
        "status": {"$ne": AccountStatus.DISCONNECTED}
    })
    
    if not account_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Instagram account connected"
        )
    
    await db.instagram_accounts.update_one(
        {"id": account_doc['id']},
        {"$set": {
            "status": AccountStatus.DISCONNECTED,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Instagram account disconnected successfully"}


@router.get("/stats", response_model=InstagramStatsResponse)
async def get_instagram_stats(current_user: dict = Depends(get_current_user)):
    """Get Instagram account statistics."""
    account_doc = await db.instagram_accounts.find_one({
        "user_id": current_user['user_id'],
        "status": {"$ne": AccountStatus.DISCONNECTED}
    })
    
    if not account_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Instagram account connected"
        )
    
    initial = account_doc.get('initial_followers', 0) or 1
    current = account_doc.get('followers_count', 0)
    growth_percentage = ((current - initial) / initial) * 100 if initial > 0 else 0
    
    return InstagramStatsResponse(
        followers_count=account_doc.get('followers_count', 0),
        following_count=account_doc.get('following_count', 0),
        posts_count=account_doc.get('posts_count', 0),
        engagement_rate=account_doc.get('engagement_rate', 0.0),
        total_followers_gained=account_doc.get('total_followers_gained', 0),
        followers_this_month=account_doc.get('followers_this_month', 0) or account_doc.get('followers_gained_this_month', 0),
        followers_this_week=account_doc.get('followers_this_week', 0) or account_doc.get('followers_gained_this_week', 0),
        followers_gained_today=account_doc.get('followers_gained_today', 0),
        growth_percentage=round(growth_percentage, 2),
        reach_today=account_doc.get('reach_today', 0),
        reach_this_week=account_doc.get('reach_this_week', 0),
        profile_visits_today=account_doc.get('profile_visits_today', 0),
        profile_visits_this_week=account_doc.get('profile_visits_this_week', 0),
        impressions_today=account_doc.get('impressions_today', 0),
        impressions_this_week=account_doc.get('impressions_this_week', 0),
        website_clicks_today=account_doc.get('website_clicks_today', 0),
        website_clicks_this_week=account_doc.get('website_clicks_this_week', 0)
    )


@router.post("/sync")
async def sync_instagram_data(current_user: dict = Depends(get_current_user)):
    """
    Simulate syncing Instagram data and show growth progress.
    In production, this would fetch real data from Instagram API.
    For now, it simulates organic growth based on time elapsed.
    """
    import random
    from datetime import timedelta
    
    account_doc = await db.instagram_accounts.find_one({
        "user_id": current_user['user_id'],
        "status": {"$ne": AccountStatus.DISCONNECTED}
    })
    
    if not account_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Instagram account connected"
        )
    
    # Check if growth is paused
    if account_doc.get('growth_paused', False):
        return {
            "message": "Growth is paused. Resume to see updates.",
            "growth_paused": True,
            "synced": False
        }
    
    # Calculate time since last sync
    last_sync_str = account_doc.get('last_sync')
    if last_sync_str:
        try:
            last_sync = datetime.fromisoformat(last_sync_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            last_sync = datetime.now(timezone.utc) - timedelta(hours=1)
    else:
        last_sync = datetime.now(timezone.utc) - timedelta(hours=1)
    
    now = datetime.now(timezone.utc)
    hours_elapsed = (now - last_sync).total_seconds() / 3600
    
    # Only simulate growth if at least 1 hour has passed
    if hours_elapsed < 0.1:  # ~6 minutes minimum
        return {
            "message": "Data is already up to date",
            "synced": False,
            "next_sync_available": (last_sync + timedelta(minutes=6)).isoformat()
        }
    
    # Simulate growth based on targeting quality and time
    targeting = await db.targeting_settings.find_one({"user_id": current_user['user_id']})
    
    # Base growth rate (followers per hour)
    base_rate = 2.5  # ~60 followers per day baseline
    
    # Targeting multiplier
    targeting_multiplier = 1.0
    if targeting:
        if targeting.get('niche'):
            targeting_multiplier += 0.3
        if targeting.get('hashtags') and len(targeting.get('hashtags', [])) >= 3:
            targeting_multiplier += 0.2
        if targeting.get('competitors') and len(targeting.get('competitors', [])) >= 2:
            targeting_multiplier += 0.2
        if targeting.get('locations') and len(targeting.get('locations', [])) >= 1:
            targeting_multiplier += 0.1
    
    # Calculate new followers
    effective_hours = min(hours_elapsed, 24)  # Cap at 24 hours to prevent huge jumps
    new_followers = int(base_rate * effective_hours * targeting_multiplier * random.uniform(0.7, 1.3))
    new_followers = max(0, new_followers)
    
    # Update account stats
    current_followers = account_doc.get('followers_count', 0)
    stored_initial = account_doc.get('initial_followers') or current_followers
    
    update_data = {
        "followers_count": current_followers + new_followers,
        "followers_gained_today": account_doc.get('followers_gained_today', 0) + new_followers,
        "followers_gained_this_week": account_doc.get('followers_gained_this_week', 0) + new_followers,
        "followers_gained_this_month": account_doc.get('followers_gained_this_month', 0) + new_followers,
        "total_followers_gained": account_doc.get('total_followers_gained', 0) + new_followers,
        "last_sync": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    # Set initial followers if not set
    if not account_doc.get('initial_followers'):
        update_data['initial_followers'] = stored_initial
    
    await db.instagram_accounts.update_one(
        {"id": account_doc['id']},
        {"$set": update_data}
    )
    
    # Log the growth
    if new_followers > 0:
        log = GrowthLog(
            user_id=current_user['user_id'],
            instagram_account_id=account_doc['id'],
            log_type=GrowthLogType.FOLLOW_GAINED,
            message=f"Gained {new_followers} new followers",
            details={"followers_gained": new_followers, "targeting_multiplier": targeting_multiplier}
        )
        log_dict = log.model_dump()
        log_dict['created_at'] = log_dict['created_at'].isoformat()
        await db.growth_logs.insert_one(log_dict)
    
    return {
        "message": f"Synced! +{new_followers} new followers",
        "synced": True,
        "new_followers": new_followers,
        "total_followers": current_followers + new_followers,
        "growth_rate": f"{base_rate * targeting_multiplier:.1f} followers/hour",
        "targeting_quality": f"{targeting_multiplier * 100:.0f}%"
    }


# Targeting endpoints
@router.get("/targeting", response_model=Optional[TargetingSettings])
async def get_targeting(current_user: dict = Depends(get_current_user)):
    """Get targeting settings."""
    targeting_doc = await db.targeting_settings.find_one(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not targeting_doc:
        return None
    
    return TargetingSettings(**targeting_doc)


@router.put("/targeting", response_model=TargetingSettings)
async def update_targeting(update_data: TargetingSettingsUpdate, current_user: dict = Depends(get_current_user)):
    """Update targeting settings."""
    targeting_doc = await db.targeting_settings.find_one({"user_id": current_user['user_id']})
    
    if not targeting_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No targeting settings found. Please connect an Instagram account first."
        )
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.targeting_settings.update_one(
        {"id": targeting_doc['id']},
        {"$set": update_dict}
    )
    
    updated_doc = await db.targeting_settings.find_one({"id": targeting_doc['id']}, {"_id": 0})
    return TargetingSettings(**updated_doc)


# Growth logs
@router.get("/logs", response_model=List[GrowthLog])
async def get_growth_logs(
    limit: int = 50,
    log_type: Optional[GrowthLogType] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get growth activity logs."""
    query = {"user_id": current_user['user_id']}
    if log_type:
        query["log_type"] = log_type
    
    logs = await db.growth_logs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [GrowthLog(**log) for log in logs]
