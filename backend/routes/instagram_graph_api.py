"""
Instagram Graph API Integration
Real data fetching for AI-powered growth recommendations
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import httpx
import logging
import os
import uuid

# Import authentication dependency
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/instagram-api", tags=["Instagram Graph API"])

# Database reference
db = None

def init_router(database):
    global db
    db = database

# Configuration
INSTAGRAM_APP_ID = os.environ.get("INSTAGRAM_APP_ID", "")
INSTAGRAM_APP_SECRET = os.environ.get("INSTAGRAM_APP_SECRET", "")
INSTAGRAM_REDIRECT_URI = os.environ.get("INSTAGRAM_REDIRECT_URI", "")
GRAPH_API_VERSION = "v18.0"
GRAPH_API_BASE = f"https://graph.instagram.com/{GRAPH_API_VERSION}"


# ============== Models ==============

class InstagramProfile(BaseModel):
    """Full Instagram profile data."""
    id: str
    username: str
    name: Optional[str] = ""
    biography: Optional[str] = ""
    website: Optional[str] = ""
    profile_picture_url: Optional[str] = ""
    followers_count: int = 0
    following_count: int = 0
    media_count: int = 0
    account_type: Optional[str] = "personal"


class MediaInsights(BaseModel):
    """Media post insights."""
    id: str
    caption: Optional[str] = ""
    media_type: str
    media_url: Optional[str] = ""
    permalink: Optional[str] = ""
    timestamp: Optional[str] = ""
    like_count: int = 0
    comments_count: int = 0
    engagement: int = 0
    impressions: int = 0
    reach: int = 0
    saved_count: int = 0


class HashtagData(BaseModel):
    """Hashtag analysis data."""
    hashtag: str
    id: str
    media_count: Optional[int] = 0
    recent_engagement_avg: float = 0
    trending_score: float = 0


class CompetitorAnalysis(BaseModel):
    """Competitor account analysis."""
    username: str
    followers_count: int = 0
    media_count: int = 0
    avg_engagement_rate: float = 0
    top_hashtags: List[str] = []
    posting_frequency: float = 0  # posts per week


class AudienceInsights(BaseModel):
    """Audience demographics and interests."""
    top_cities: List[Dict[str, Any]] = []
    top_countries: List[Dict[str, Any]] = []
    age_gender_distribution: List[Dict[str, Any]] = []
    active_times: List[Dict[str, Any]] = []


class GrowthData(BaseModel):
    """Comprehensive growth data for AI."""
    profile: InstagramProfile
    recent_media: List[MediaInsights] = []
    top_hashtags: List[HashtagData] = []
    competitors: List[CompetitorAnalysis] = []
    audience: Optional[AudienceInsights] = None
    niche_keywords: List[str] = []
    recommended_hashtags: List[str] = []
    growth_trends: Dict[str, Any] = {}


# ============== OAuth Flow ==============

class OAuthState(BaseModel):
    """OAuth state for CSRF protection."""
    state: str
    user_id: str
    created_at: datetime
    

@router.get("/oauth/authorize")
async def get_oauth_authorization_url(
    current_user: dict = Depends(get_current_user)
):
    """
    Generate Instagram OAuth authorization URL.
    User clicks this to start the OAuth flow.
    """
    if not INSTAGRAM_APP_ID or not INSTAGRAM_REDIRECT_URI:
        raise HTTPException(
            status_code=500, 
            detail="Instagram OAuth not configured. Please set INSTAGRAM_APP_ID and INSTAGRAM_REDIRECT_URI in environment."
        )
    
    import secrets
    state = secrets.token_urlsafe(32)
    
    # Store state in database for verification
    await db.oauth_states.insert_one({
        "state": state,
        "user_id": current_user['user_id'],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    })
    
    # Build OAuth URL for Instagram Basic Display API
    # Scopes: user_profile (required), user_media (optional for media access)
    scopes = "user_profile,user_media"
    auth_url = (
        f"https://api.instagram.com/oauth/authorize"
        f"?client_id={INSTAGRAM_APP_ID}"
        f"&redirect_uri={INSTAGRAM_REDIRECT_URI}"
        f"&scope={scopes}"
        f"&response_type=code"
        f"&state={state}"
    )
    
    return {
        "authorization_url": auth_url,
        "state": state,
        "message": "Redirect user to authorization_url to start OAuth flow"
    }


@router.get("/oauth/callback")
async def oauth_callback(
    code: str = None,
    state: str = None,
    error: str = None,
    error_reason: str = None,
    error_description: str = None
):
    """
    Handle OAuth callback from Instagram.
    This endpoint receives the authorization code after user grants permission.
    """
    from urllib.parse import quote
    
    # Handle errors
    if error:
        error_msg = error_description or error_reason or error
        # Redirect to frontend with error
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/connect-instagram?error={quote(error_msg)}")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state parameter")
    
    # Verify state
    stored_state = await db.oauth_states.find_one({"state": state})
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid or expired state parameter")
    
    # Delete used state
    await db.oauth_states.delete_one({"state": state})
    
    user_id = stored_state['user_id']
    
    try:
        # Exchange code for short-lived access token
        async with httpx.AsyncClient(timeout=30.0) as client:
            token_response = await client.post(
                "https://api.instagram.com/oauth/access_token",
                data={
                    "client_id": INSTAGRAM_APP_ID,
                    "client_secret": INSTAGRAM_APP_SECRET,
                    "grant_type": "authorization_code",
                    "redirect_uri": INSTAGRAM_REDIRECT_URI,
                    "code": code
                }
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
            
            token_data = token_response.json()
            short_lived_token = token_data.get("access_token")
            instagram_user_id = token_data.get("user_id")
            
            # Exchange for long-lived token (60 days)
            long_lived_response = await client.get(
                f"{GRAPH_API_BASE}/access_token",
                params={
                    "grant_type": "ig_exchange_token",
                    "client_secret": INSTAGRAM_APP_SECRET,
                    "access_token": short_lived_token
                }
            )
            
            if long_lived_response.status_code != 200:
                logger.warning("Failed to get long-lived token, using short-lived")
                access_token = short_lived_token
                expires_in = 3600  # 1 hour
            else:
                long_lived_data = long_lived_response.json()
                access_token = long_lived_data.get("access_token")
                expires_in = long_lived_data.get("expires_in", 5184000)  # 60 days default
            
            # Fetch user profile using Basic Display API fields
            # Basic Display API supports: id, username, account_type, media_count
            profile_response = await client.get(
                f"{GRAPH_API_BASE}/me",
                params={
                    "fields": "id,username,account_type,media_count",
                    "access_token": access_token
                }
            )
            
            if profile_response.status_code != 200:
                logger.error(f"Failed to fetch profile: {profile_response.text}")
                raise HTTPException(status_code=400, detail="Failed to fetch Instagram profile")
            
            profile_data = profile_response.json()
        
        # Update or create Instagram account
        account_data = {
            "instagram_id": str(instagram_user_id),
            "username": profile_data.get("username", ""),
            "name": profile_data.get("username", ""),  # Basic Display doesn't provide name
            "biography": "",  # Not available in Basic Display
            "profile_picture_url": "",  # Not available in Basic Display
            "account_type": profile_data.get("account_type", "personal"),
            "followers_count": 0,  # Not available in Basic Display
            "following_count": 0,  # Not available in Basic Display
            "posts_count": profile_data.get("media_count", 0),
            "access_token": access_token,
            "token_expires_at": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
            "oauth_connected": True,
            "status": "active",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update the existing Instagram account for this user
        result = await db.instagram_accounts.update_one(
            {"user_id": user_id},
            {"$set": account_data}
        )
        
        if result.modified_count == 0:
            # Create new if doesn't exist
            account_data["user_id"] = user_id
            account_data["id"] = str(uuid.uuid4())
            account_data["created_at"] = datetime.now(timezone.utc).isoformat()
            account_data["risk_disclaimer_accepted"] = True
            account_data["disclaimer_accepted_at"] = datetime.now(timezone.utc).isoformat()
            await db.instagram_accounts.insert_one(account_data)
        
        # Also create targeting settings if not exists
        existing_targeting = await db.targeting_settings.find_one({"user_id": user_id})
        if not existing_targeting:
            await db.targeting_settings.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "instagram_account_id": account_data.get("id"),
                "niche": "",
                "hashtags": [],
                "competitor_accounts": [],
                "locations": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            })
        
        logger.info(f"Successfully connected Instagram for user {user_id}: @{profile_data.get('username')}")
        
        # Redirect to frontend with success
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(
            url=f"{frontend_url}/connect-instagram?success=true&username={profile_data.get('username')}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback error: {str(e)}")
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/connect-instagram?error=OAuth+failed")


@router.post("/oauth/refresh-token")
async def refresh_instagram_token(
    current_user: dict = Depends(get_current_user)
):
    """
    Refresh Instagram long-lived access token.
    Long-lived tokens can be refreshed before they expire.
    """
    user_id = current_user['user_id']
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id, "oauth_connected": True},
        {"_id": 0}
    )
    
    if not account or not account.get("access_token"):
        raise HTTPException(status_code=404, detail="No OAuth-connected Instagram account found")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{GRAPH_API_BASE}/refresh_access_token",
                params={
                    "grant_type": "ig_refresh_token",
                    "access_token": account["access_token"]
                }
            )
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.text}")
                raise HTTPException(status_code=400, detail="Failed to refresh token")
            
            data = response.json()
            new_token = data.get("access_token")
            expires_in = data.get("expires_in", 5184000)
            
            await db.instagram_accounts.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "access_token": new_token,
                        "token_expires_at": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            return {
                "message": "Token refreshed successfully",
                "expires_in": expires_in
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=500, detail="Token refresh failed")


@router.get("/oauth/status")
async def get_oauth_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Check if user has an OAuth-connected Instagram account.
    """
    user_id = current_user['user_id']
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0, "access_token": 0}  # Don't return sensitive data
    )
    
    if not account:
        return {
            "connected": False,
            "oauth_connected": False,
            "message": "No Instagram account connected"
        }
    
    is_oauth = account.get("oauth_connected", False)
    token_expires = account.get("token_expires_at")
    
    token_valid = False
    if token_expires:
        try:
            expires_at = datetime.fromisoformat(token_expires.replace('Z', '+00:00'))
            token_valid = expires_at > datetime.now(timezone.utc)
        except:
            pass
    
    return {
        "connected": True,
        "oauth_connected": is_oauth,
        "username": account.get("username"),
        "followers_count": account.get("followers_count", 0),
        "posts_count": account.get("posts_count", 0),
        "token_valid": token_valid if is_oauth else None,
        "token_expires_at": token_expires if is_oauth else None,
        "message": "OAuth connected" if is_oauth else "Manual connection (no real API access)"
    }




# ============== Helper Functions ==============

async def get_instagram_token(user_id: str) -> Optional[str]:
    """Get user's Instagram access token."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return None
    
    # Check if we have a connected Instagram account
    ig_account = await db.instagram_accounts.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    if ig_account and ig_account.get("access_token"):
        return ig_account["access_token"]
    
    return None


async def make_instagram_request(
    endpoint: str,
    access_token: str,
    params: Optional[Dict] = None
) -> Optional[Dict]:
    """Make a request to Instagram Graph API with error handling."""
    if not params:
        params = {}
    
    params["access_token"] = access_token
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{GRAPH_API_BASE}/{endpoint}", params=params)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                logger.error("Instagram token expired")
                return None
            elif response.status_code == 429:
                logger.warning("Instagram rate limit hit")
                return None
            else:
                logger.error(f"Instagram API error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Instagram request failed: {str(e)}")
        return None


# ============== Data Fetching Functions ==============

async def fetch_profile_data(user_id: str, ig_account_id: str, access_token: str) -> Optional[InstagramProfile]:
    """Fetch complete profile data from Instagram."""
    data = await make_instagram_request(
        ig_account_id,
        access_token,
        {
            "fields": "id,username,name,biography,website,profile_picture_url,followers_count,following_count,media_count"
        }
    )
    
    if data:
        return InstagramProfile(**data)
    return None


async def fetch_media_insights(ig_account_id: str, access_token: str, limit: int = 25) -> List[MediaInsights]:
    """Fetch recent media with engagement metrics."""
    data = await make_instagram_request(
        f"{ig_account_id}/media",
        access_token,
        {
            "fields": "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
            "limit": limit
        }
    )
    
    if data and "data" in data:
        return [MediaInsights(**media) for media in data["data"]]
    return []


async def search_hashtag(hashtag: str, user_id: str, access_token: str) -> Optional[HashtagData]:
    """Search for hashtag and get its data."""
    # First, get hashtag ID
    search_data = await make_instagram_request(
        "ig_hashtag_search",
        access_token,
        {"user_id": user_id, "q": hashtag}
    )
    
    if not search_data or "data" not in search_data or not search_data["data"]:
        return None
    
    hashtag_id = search_data["data"][0]["id"]
    
    # Get recent media for engagement analysis
    media_data = await make_instagram_request(
        f"{hashtag_id}/recent_media",
        access_token,
        {
            "user_id": user_id,
            "fields": "id,like_count,comments_count",
            "limit": 25
        }
    )
    
    avg_engagement = 0
    if media_data and "data" in media_data:
        engagements = [
            (m.get("like_count", 0) + m.get("comments_count", 0))
            for m in media_data["data"]
        ]
        avg_engagement = sum(engagements) / len(engagements) if engagements else 0
    
    return HashtagData(
        hashtag=hashtag,
        id=hashtag_id,
        recent_engagement_avg=avg_engagement,
        trending_score=min(avg_engagement / 100, 10)  # Normalized score
    )


async def analyze_competitor(username: str, user_id: str, access_token: str) -> Optional[CompetitorAnalysis]:
    """Analyze a competitor's public profile."""
    data = await make_instagram_request(
        user_id,
        access_token,
        {
            "fields": f"business_discovery.username({username}){{followers_count,media_count,media{{like_count,comments_count,caption}}}}"
        }
    )
    
    if not data or "business_discovery" not in data:
        return None
    
    bd = data["business_discovery"]
    media_list = bd.get("media", {}).get("data", [])
    
    # Calculate engagement rate
    total_engagement = sum(
        m.get("like_count", 0) + m.get("comments_count", 0)
        for m in media_list
    )
    avg_engagement_rate = 0
    if media_list and bd.get("followers_count", 0) > 0:
        avg_engagement_rate = (total_engagement / len(media_list)) / bd["followers_count"] * 100
    
    # Extract hashtags from captions
    hashtags = []
    for media in media_list:
        caption = media.get("caption", "") or ""
        tags = [word[1:] for word in caption.split() if word.startswith("#")]
        hashtags.extend(tags)
    
    # Get top hashtags
    from collections import Counter
    top_hashtags = [tag for tag, _ in Counter(hashtags).most_common(10)]
    
    return CompetitorAnalysis(
        username=username,
        followers_count=bd.get("followers_count", 0),
        media_count=bd.get("media_count", 0),
        avg_engagement_rate=round(avg_engagement_rate, 2),
        top_hashtags=top_hashtags,
        posting_frequency=len(media_list) / 4 if media_list else 0  # Approximate posts/week
    )


async def fetch_audience_insights(ig_account_id: str, access_token: str) -> Optional[AudienceInsights]:
    """Fetch audience demographics (Business/Creator accounts only)."""
    data = await make_instagram_request(
        f"{ig_account_id}/insights",
        access_token,
        {
            "metric": "audience_city,audience_country,audience_gender_age",
            "period": "lifetime"
        }
    )
    
    if not data or "data" not in data:
        return None
    
    insights = AudienceInsights()
    
    for metric in data["data"]:
        name = metric.get("name")
        values = metric.get("values", [{}])[0].get("value", {})
        
        if name == "audience_city":
            insights.top_cities = [
                {"city": k, "count": v}
                for k, v in sorted(values.items(), key=lambda x: x[1], reverse=True)[:10]
            ]
        elif name == "audience_country":
            insights.top_countries = [
                {"country": k, "count": v}
                for k, v in sorted(values.items(), key=lambda x: x[1], reverse=True)[:10]
            ]
        elif name == "audience_gender_age":
            insights.age_gender_distribution = [
                {"demographic": k, "count": v}
                for k, v in values.items()
            ]
    
    return insights


# ============== AI Data Aggregation ==============

async def aggregate_growth_data(
    user_id: str,
    ig_account_id: str,
    access_token: str,
    competitor_usernames: List[str] = None,
    target_hashtags: List[str] = None
) -> GrowthData:
    """
    Aggregate all Instagram data for AI analysis.
    This is the main function used by AI to get comprehensive growth data.
    """
    growth_data = GrowthData(
        profile=InstagramProfile(id="", username="")
    )
    
    # 1. Fetch profile data
    profile = await fetch_profile_data(user_id, ig_account_id, access_token)
    if profile:
        growth_data.profile = profile
    
    # 2. Fetch recent media
    growth_data.recent_media = await fetch_media_insights(ig_account_id, access_token)
    
    # 3. Analyze hashtags from user's content
    user_hashtags = []
    for media in growth_data.recent_media:
        if media.caption:
            tags = [word[1:] for word in media.caption.split() if word.startswith("#")]
            user_hashtags.extend(tags)
    
    # Get unique top hashtags
    from collections import Counter
    top_user_hashtags = [tag for tag, _ in Counter(user_hashtags).most_common(10)]
    
    # Search for hashtag data
    for hashtag in top_user_hashtags[:5]:  # Limit to avoid rate limits
        hashtag_data = await search_hashtag(hashtag, ig_account_id, access_token)
        if hashtag_data:
            growth_data.top_hashtags.append(hashtag_data)
    
    # 4. Analyze competitors if provided
    if competitor_usernames:
        for username in competitor_usernames[:3]:  # Limit to 3 competitors
            competitor = await analyze_competitor(username, ig_account_id, access_token)
            if competitor:
                growth_data.competitors.append(competitor)
    
    # 5. Fetch audience insights (if available)
    growth_data.audience = await fetch_audience_insights(ig_account_id, access_token)
    
    # 6. Extract niche keywords from bio and captions
    niche_keywords = []
    if growth_data.profile.biography:
        bio_words = growth_data.profile.biography.lower().split()
        niche_keywords.extend([w for w in bio_words if len(w) > 4 and w.isalpha()])
    
    for media in growth_data.recent_media[:5]:
        if media.caption:
            caption_words = media.caption.lower().split()
            niche_keywords.extend([w for w in caption_words if len(w) > 4 and w.isalpha() and not w.startswith("#")])
    
    from collections import Counter
    growth_data.niche_keywords = [word for word, _ in Counter(niche_keywords).most_common(20)]
    
    # 7. Calculate growth trends
    if growth_data.recent_media:
        total_likes = sum(m.like_count for m in growth_data.recent_media)
        total_comments = sum(m.comments_count for m in growth_data.recent_media)
        media_count = len(growth_data.recent_media)
        
        avg_likes = total_likes / media_count
        avg_comments = total_comments / media_count
        avg_engagement = avg_likes + avg_comments
        
        engagement_rate = 0
        if growth_data.profile.followers_count > 0:
            engagement_rate = (avg_engagement / growth_data.profile.followers_count) * 100
        
        growth_data.growth_trends = {
            "avg_likes_per_post": round(avg_likes, 1),
            "avg_comments_per_post": round(avg_comments, 1),
            "avg_engagement_per_post": round(avg_engagement, 1),
            "engagement_rate": round(engagement_rate, 2),
            "posting_consistency": "high" if media_count > 20 else "medium" if media_count > 10 else "low"
        }
    
    # 8. Generate recommended hashtags based on analysis
    recommended = set()
    
    # From competitor analysis
    for competitor in growth_data.competitors:
        recommended.update(competitor.top_hashtags[:5])
    
    # From user's top performing hashtags
    for hashtag_data in growth_data.top_hashtags:
        if hashtag_data.trending_score > 3:
            recommended.add(hashtag_data.hashtag)
    
    growth_data.recommended_hashtags = list(recommended)[:15]
    
    return growth_data


# ============== API Endpoints ==============

@router.get("/fetch-growth-data/{user_id}")
async def get_growth_data_for_ai(
    user_id: str,
    competitors: Optional[str] = None,  # Comma-separated usernames
    hashtags: Optional[str] = None  # Comma-separated hashtags
):
    """
    Fetch comprehensive Instagram data for AI growth planning.
    This endpoint aggregates all available data for AI analysis.
    """
    # Get user's Instagram account
    ig_account = await db.instagram_accounts.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    if not ig_account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    access_token = ig_account.get("access_token")
    ig_account_id = ig_account.get("instagram_id") or ig_account.get("id")
    
    if not access_token:
        # Return mock data for demo purposes
        return await get_mock_growth_data(user_id, ig_account)
    
    # Parse optional parameters
    competitor_list = competitors.split(",") if competitors else []
    hashtag_list = hashtags.split(",") if hashtags else []
    
    # Aggregate real data
    growth_data = await aggregate_growth_data(
        user_id=user_id,
        ig_account_id=ig_account_id,
        access_token=access_token,
        competitor_usernames=competitor_list,
        target_hashtags=hashtag_list
    )
    
    # Cache the data
    await db.instagram_growth_data.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "data": growth_data.model_dump(),
                "fetched_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return growth_data


async def get_mock_growth_data(user_id: str, ig_account: dict) -> GrowthData:
    """Generate realistic mock data when real API is not available."""
    import random
    
    username = ig_account.get("username", "user")
    followers = ig_account.get("followers_count", random.randint(500, 15000))
    
    # Detect niche from username or default
    niche_map = {
        "fitness": ["workout", "gym", "health", "fit", "training"],
        "fashion": ["style", "outfit", "fashion", "wear", "look"],
        "food": ["food", "recipe", "cook", "eat", "chef"],
        "travel": ["travel", "adventure", "explore", "trip", "wander"],
        "tech": ["tech", "code", "dev", "digital", "software"],
        "lifestyle": ["life", "daily", "home", "living", "wellness"],
        "art": ["art", "design", "creative", "draw", "paint"],
        "music": ["music", "song", "artist", "band", "sound"],
        "business": ["business", "entrepreneur", "startup", "success", "growth"],
        "pets": ["pet", "dog", "cat", "animal", "puppy"]
    }
    
    detected_niche = "lifestyle"
    for niche, keywords in niche_map.items():
        if any(kw in username.lower() for kw in keywords):
            detected_niche = niche
            break
    
    # Generate niche-appropriate hashtags
    niche_hashtags = {
        "fitness": ["fitness", "workout", "gym", "fitfam", "motivation", "health", "training", "bodybuilding", "fitlife", "exercise"],
        "fashion": ["fashion", "style", "ootd", "fashionista", "outfitoftheday", "streetstyle", "fashionblogger", "instafashion", "stylish", "trendy"],
        "food": ["food", "foodie", "foodporn", "instafood", "yummy", "delicious", "homemade", "recipe", "foodstagram", "cooking"],
        "travel": ["travel", "wanderlust", "adventure", "explore", "travelgram", "travelphotography", "vacation", "trip", "traveling", "instatravel"],
        "tech": ["tech", "technology", "coding", "developer", "programming", "software", "startup", "innovation", "digital", "ai"],
        "lifestyle": ["lifestyle", "life", "happy", "love", "instagood", "photooftheday", "beautiful", "instadaily", "motivation", "inspiration"],
        "art": ["art", "artist", "artwork", "drawing", "illustration", "creative", "design", "painting", "sketch", "artoftheday"],
        "music": ["music", "musician", "song", "singer", "artist", "newmusic", "livemusic", "musiclife", "band", "songwriter"],
        "business": ["business", "entrepreneur", "success", "motivation", "startup", "marketing", "hustle", "goals", "mindset", "growth"],
        "pets": ["pets", "dog", "cat", "puppy", "dogsofinstagram", "catsofinstagram", "cute", "pet", "animal", "petsofinstagram"]
    }
    
    hashtags = niche_hashtags.get(detected_niche, niche_hashtags["lifestyle"])
    
    # Calculate realistic engagement rate based on follower count
    if followers < 1000:
        engagement_rate = random.uniform(5.0, 10.0)
    elif followers < 10000:
        engagement_rate = random.uniform(3.0, 6.0)
    elif followers < 100000:
        engagement_rate = random.uniform(1.5, 4.0)
    else:
        engagement_rate = random.uniform(1.0, 2.5)
    
    avg_likes = int(followers * engagement_rate / 100 * 0.9)
    avg_comments = int(followers * engagement_rate / 100 * 0.1)
    
    return GrowthData(
        profile=InstagramProfile(
            id=ig_account.get("id", "mock_id"),
            username=username,
            name=ig_account.get("name", username.replace("_", " ").title()),
            biography=f"Passionate about {detected_niche}. Creating content that inspires.",
            followers_count=followers,
            following_count=int(followers * random.uniform(0.3, 0.8)),
            media_count=random.randint(20, 200),
            account_type="creator"
        ),
        recent_media=[
            MediaInsights(
                id=f"media_{i}",
                caption=f"Amazing {detected_niche} content! #{hashtags[i % len(hashtags)]}",
                media_type="IMAGE",
                like_count=int(avg_likes * random.uniform(0.7, 1.3)),
                comments_count=int(avg_comments * random.uniform(0.5, 1.5)),
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            for i in range(10)
        ],
        top_hashtags=[
            HashtagData(
                hashtag=tag,
                id=f"hashtag_{i}",
                recent_engagement_avg=random.uniform(100, 1000),
                trending_score=random.uniform(3, 8)
            )
            for i, tag in enumerate(hashtags[:5])
        ],
        competitors=[],  # Would need real competitor usernames
        audience=AudienceInsights(
            top_countries=[
                {"country": "US", "count": int(followers * 0.4)},
                {"country": "UK", "count": int(followers * 0.15)},
                {"country": "CA", "count": int(followers * 0.1)},
            ],
            top_cities=[
                {"city": "Los Angeles", "count": int(followers * 0.08)},
                {"city": "New York", "count": int(followers * 0.07)},
                {"city": "London", "count": int(followers * 0.05)},
            ],
            age_gender_distribution=[
                {"demographic": "18-24_female", "count": int(followers * 0.25)},
                {"demographic": "25-34_female", "count": int(followers * 0.20)},
                {"demographic": "18-24_male", "count": int(followers * 0.15)},
                {"demographic": "25-34_male", "count": int(followers * 0.15)},
            ]
        ),
        niche_keywords=[detected_niche] + hashtags[:5],
        recommended_hashtags=hashtags,
        growth_trends={
            "avg_likes_per_post": avg_likes,
            "avg_comments_per_post": avg_comments,
            "avg_engagement_per_post": avg_likes + avg_comments,
            "engagement_rate": round(engagement_rate, 2),
            "posting_consistency": "medium",
            "detected_niche": detected_niche
        }
    )


# ============== Real Data Refresh Endpoint ==============

@router.post("/refresh-data")
async def refresh_instagram_data(
    current_user: dict = Depends(get_current_user)
):
    """
    Refresh Instagram data from the API and update the database.
    This fetches real data if OAuth is connected, otherwise returns current stored data.
    """
    user_id = current_user['user_id']
    
    # Get the Instagram account
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    # Check if OAuth connected with valid token
    if account.get("oauth_connected") and account.get("access_token"):
        token_expires = account.get("token_expires_at")
        token_valid = False
        
        if token_expires:
            try:
                expires_at = datetime.fromisoformat(token_expires.replace('Z', '+00:00'))
                token_valid = expires_at > datetime.now(timezone.utc)
            except (ValueError, AttributeError):
                pass
        
        if token_valid:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    # Fetch fresh profile data
                    profile_response = await client.get(
                        f"{GRAPH_API_BASE}/me",
                        params={
                            "fields": "id,username,name,account_type,media_count,followers_count,follows_count,biography,profile_picture_url",
                            "access_token": account["access_token"]
                        }
                    )
                    
                    if profile_response.status_code == 200:
                        profile_data = profile_response.json()
                        
                        # Calculate engagement rate from recent posts
                        engagement_rate = 0
                        media_response = await client.get(
                            f"{GRAPH_API_BASE}/me/media",
                            params={
                                "fields": "id,like_count,comments_count",
                                "limit": 10,
                                "access_token": account["access_token"]
                            }
                        )
                        
                        if media_response.status_code == 200:
                            media_data = media_response.json()
                            if media_data.get("data"):
                                total_engagement = sum(
                                    m.get("like_count", 0) + m.get("comments_count", 0) 
                                    for m in media_data["data"]
                                )
                                followers = profile_data.get("followers_count", 1)
                                if followers > 0 and len(media_data["data"]) > 0:
                                    engagement_rate = (total_engagement / len(media_data["data"])) / followers * 100
                        
                        # Update database with fresh data
                        update_data = {
                            "username": profile_data.get("username", account.get("username")),
                            "name": profile_data.get("name", ""),
                            "biography": profile_data.get("biography", ""),
                            "profile_picture_url": profile_data.get("profile_picture_url", ""),
                            "followers_count": profile_data.get("followers_count", 0),
                            "following_count": profile_data.get("follows_count", 0),
                            "posts_count": profile_data.get("media_count", 0),
                            "engagement_rate": round(engagement_rate, 2),
                            "last_refreshed": datetime.now(timezone.utc).isoformat(),
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                        
                        await db.instagram_accounts.update_one(
                            {"user_id": user_id},
                            {"$set": update_data}
                        )
                        
                        logger.info(f"Refreshed Instagram data for user {user_id}")
                        
                        return {
                            "success": True,
                            "data_source": "instagram_api",
                            "username": update_data["username"],
                            "followers_count": update_data["followers_count"],
                            "following_count": update_data["following_count"],
                            "posts_count": update_data["posts_count"],
                            "engagement_rate": update_data["engagement_rate"],
                            "last_refreshed": update_data["last_refreshed"],
                            "message": "Data refreshed from Instagram API"
                        }
                    else:
                        logger.warning(f"Failed to fetch profile: {profile_response.status_code}")
                        
            except Exception as e:
                logger.error(f"Error refreshing Instagram data: {str(e)}")
        
        # Token expired or request failed - return stored data
        return {
            "success": True,
            "data_source": "database",
            "username": account.get("username"),
            "followers_count": account.get("followers_count", 0),
            "following_count": account.get("following_count", 0),
            "posts_count": account.get("posts_count", 0),
            "engagement_rate": account.get("engagement_rate", 0),
            "last_refreshed": account.get("last_refreshed"),
            "token_expired": not token_valid,
            "message": "Token expired. Using cached data. Please reconnect Instagram."
        }
    
    # Manual connection - return stored data
    return {
        "success": True,
        "data_source": "manual",
        "username": account.get("username"),
        "followers_count": account.get("followers_count", 0),
        "following_count": account.get("following_count", 0),
        "posts_count": account.get("posts_count", 0),
        "engagement_rate": account.get("engagement_rate", 0),
        "message": "Manual connection. Connect via OAuth for real-time data."
    }


@router.get("/account-stats")
async def get_account_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current Instagram account statistics.
    Returns real data if OAuth connected, otherwise returns stored/simulated data.
    """
    user_id = current_user['user_id']
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0, "access_token": 0}  # Don't return token
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    return {
        "username": account.get("username"),
        "name": account.get("name", ""),
        "biography": account.get("biography", ""),
        "profile_picture_url": account.get("profile_picture_url", ""),
        "followers_count": account.get("followers_count", 0),
        "following_count": account.get("following_count", 0),
        "posts_count": account.get("posts_count", 0),
        "engagement_rate": account.get("engagement_rate", 0),
        "oauth_connected": account.get("oauth_connected", False),
        "status": account.get("status", "active"),
        "last_refreshed": account.get("last_refreshed"),
        "created_at": account.get("created_at"),
        "growth_paused": account.get("growth_paused", False)
    }

