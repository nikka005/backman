"""
Advanced AI Analytics API Routes
Provides AI-powered insights and analytics for Instagram growth
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import logging
import json

from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-analytics", tags=["AI Analytics"])

# Database reference
db = None

def init_router(database):
    """Initialize router with database connection."""
    global db
    db = database


# ============== Models ==============

class AIInsight(BaseModel):
    """AI-generated insight."""
    type: str  # growth, engagement, content, timing, hashtag
    title: str
    description: str
    action_items: List[str] = []
    confidence: float = 0.0
    priority: str = "medium"  # low, medium, high


class PerformanceMetrics(BaseModel):
    """Account performance metrics."""
    engagement_score: float = 0.0
    growth_score: float = 0.0
    content_score: float = 0.0
    consistency_score: float = 0.0
    overall_score: float = 0.0


class ContentRecommendation(BaseModel):
    """AI content recommendation."""
    type: str  # post, story, reel
    topic: str
    best_time: str
    hashtags: List[str] = []
    caption_suggestion: str = ""


# ============== Helper Functions ==============

async def get_ai_service():
    """Get the AI service for generating insights."""
    try:
        from utils.ai_service import get_ai_service as get_service
        return get_service()
    except Exception as e:
        logger.warning(f"AI service not available: {e}")
        return None


async def generate_growth_analysis(account: dict, growth_logs: list, subscription: dict) -> Dict:
    """Generate AI-powered growth analysis."""
    ai = await get_ai_service()
    
    # Calculate basic metrics
    current_followers = account.get("followers_count", 0)
    start_followers = subscription.get("start_followers", 0) if subscription else 0
    gained = current_followers - start_followers
    
    engagement_rate = account.get("engagement_rate", 0)
    posts_count = account.get("posts_count", 0)
    
    # Calculate daily growth
    daily_growth = []
    for log in growth_logs[-30:]:
        daily_growth.append(log.get("followers_gained", 0))
    
    avg_daily = sum(daily_growth) / len(daily_growth) if daily_growth else 0
    
    analysis = {
        "current_followers": current_followers,
        "total_gained": gained,
        "avg_daily_growth": round(avg_daily, 1),
        "engagement_rate": engagement_rate,
        "growth_trend": "stable",
        "insights": []
    }
    
    # Determine growth trend
    if len(daily_growth) >= 7:
        recent_avg = sum(daily_growth[-7:]) / 7
        older_avg = sum(daily_growth[:-7]) / max(1, len(daily_growth) - 7) if len(daily_growth) > 7 else recent_avg
        
        if recent_avg > older_avg * 1.2:
            analysis["growth_trend"] = "accelerating"
        elif recent_avg < older_avg * 0.8:
            analysis["growth_trend"] = "slowing"
    
    # Generate AI insights if available
    if ai:
        try:
            prompt = f"""
            Analyze this Instagram account performance and provide brief insights:
            - Current followers: {current_followers}
            - Followers gained: {gained}
            - Average daily growth: {avg_daily}
            - Engagement rate: {engagement_rate}%
            - Total posts: {posts_count}
            - Growth trend: {analysis['growth_trend']}
            
            Provide 3 actionable insights in JSON format:
            {{"insights": [
                {{"type": "growth/engagement/content", "title": "...", "description": "...", "action_items": ["..."], "priority": "high/medium/low"}}
            ]}}
            """
            
            response = await ai.chat(prompt)
            if response:
                try:
                    data = json.loads(response)
                    analysis["insights"] = data.get("insights", [])
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            logger.warning(f"AI analysis failed: {e}")
    
    # Add default insights if AI didn't provide any
    if not analysis["insights"]:
        insights = []
        
        if analysis["growth_trend"] == "accelerating":
            insights.append({
                "type": "growth",
                "title": "Growth Momentum",
                "description": "Your account is gaining momentum! Keep up the consistent posting.",
                "action_items": ["Maintain posting schedule", "Engage with new followers"],
                "priority": "high"
            })
        elif analysis["growth_trend"] == "slowing":
            insights.append({
                "type": "growth",
                "title": "Growth Opportunity",
                "description": "Growth has slowed recently. Consider refreshing your content strategy.",
                "action_items": ["Try new content formats", "Analyze what worked before", "Engage more with your audience"],
                "priority": "high"
            })
        
        if engagement_rate < 2:
            insights.append({
                "type": "engagement",
                "title": "Boost Engagement",
                "description": "Your engagement rate could be higher. Try asking questions in your captions.",
                "action_items": ["Use calls-to-action", "Reply to all comments", "Post during peak hours"],
                "priority": "medium"
            })
        elif engagement_rate > 5:
            insights.append({
                "type": "engagement",
                "title": "Excellent Engagement",
                "description": "Your engagement rate is above average! Your content resonates well.",
                "action_items": ["Document what's working", "Double down on popular content types"],
                "priority": "low"
            })
        
        if posts_count < 50:
            insights.append({
                "type": "content",
                "title": "Build Content Library",
                "description": "More content helps with discoverability. Aim for 3-5 posts per week.",
                "action_items": ["Plan content calendar", "Batch create content", "Repurpose existing content"],
                "priority": "medium"
            })
        
        analysis["insights"] = insights[:3]
    
    return analysis


async def calculate_performance_scores(account: dict, targeting: dict) -> PerformanceMetrics:
    """Calculate comprehensive performance scores."""
    scores = PerformanceMetrics()
    
    # Engagement score (0-100)
    engagement_rate = account.get("engagement_rate", 0)
    if engagement_rate >= 6:
        scores.engagement_score = 100
    elif engagement_rate >= 4:
        scores.engagement_score = 80
    elif engagement_rate >= 2:
        scores.engagement_score = 60
    elif engagement_rate >= 1:
        scores.engagement_score = 40
    else:
        scores.engagement_score = 20
    
    # Growth score based on recent activity
    followers_gained = account.get("total_followers_gained", 0)
    if followers_gained >= 1000:
        scores.growth_score = 100
    elif followers_gained >= 500:
        scores.growth_score = 80
    elif followers_gained >= 200:
        scores.growth_score = 60
    elif followers_gained >= 50:
        scores.growth_score = 40
    else:
        scores.growth_score = 20
    
    # Content score based on posts
    posts = account.get("posts_count", 0)
    if posts >= 100:
        scores.content_score = 100
    elif posts >= 50:
        scores.content_score = 80
    elif posts >= 25:
        scores.content_score = 60
    elif posts >= 10:
        scores.content_score = 40
    else:
        scores.content_score = 20
    
    # Consistency score based on targeting setup
    if targeting:
        consistency = 0
        if targeting.get("niche"):
            consistency += 25
        if targeting.get("hashtags") and len(targeting.get("hashtags", [])) >= 3:
            consistency += 25
        if targeting.get("competitor_accounts") and len(targeting.get("competitor_accounts", [])) >= 2:
            consistency += 25
        if targeting.get("locations") and len(targeting.get("locations", [])) >= 1:
            consistency += 25
        scores.consistency_score = consistency
    else:
        scores.consistency_score = 0
    
    # Overall score (weighted average)
    scores.overall_score = round(
        scores.engagement_score * 0.3 +
        scores.growth_score * 0.3 +
        scores.content_score * 0.2 +
        scores.consistency_score * 0.2,
        1
    )
    
    return scores


async def generate_content_recommendations(account: dict, targeting: dict) -> List[ContentRecommendation]:
    """Generate AI-powered content recommendations."""
    recommendations = []
    
    niche = targeting.get("niche", "lifestyle") if targeting else "lifestyle"
    hashtags = targeting.get("hashtags", []) if targeting else []
    
    # Best posting times by day
    best_times = {
        "Monday": "6:00 PM - 9:00 PM",
        "Tuesday": "11:00 AM - 1:00 PM",
        "Wednesday": "7:00 PM - 9:00 PM",
        "Thursday": "12:00 PM - 2:00 PM",
        "Friday": "5:00 PM - 7:00 PM",
        "Saturday": "10:00 AM - 12:00 PM",
        "Sunday": "9:00 AM - 11:00 AM"
    }
    
    # Content ideas by niche
    niche_content = {
        "fitness": [
            {"type": "reel", "topic": "Quick workout routine", "caption": "Try this 5-minute workout! Save for later 💪"},
            {"type": "post", "topic": "Transformation Tuesday", "caption": "Every step counts. What's your goal this week?"},
            {"type": "story", "topic": "Daily motivation", "caption": "Rise and grind! What's your workout today?"}
        ],
        "fashion": [
            {"type": "reel", "topic": "Outfit transitions", "caption": "From day to night in 3 looks ✨"},
            {"type": "post", "topic": "OOTD with styling tips", "caption": "Style tip: Accessories make the outfit!"},
            {"type": "story", "topic": "Try-on haul", "caption": "New arrivals! Which is your favorite?"}
        ],
        "food": [
            {"type": "reel", "topic": "Quick recipe", "caption": "Easy weeknight dinner in 15 mins 🍝"},
            {"type": "post", "topic": "Restaurant review", "caption": "Found a hidden gem! Save this spot."},
            {"type": "story", "topic": "Cooking process", "caption": "Making dinner! Guess what it is?"}
        ],
        "travel": [
            {"type": "reel", "topic": "Destination highlights", "caption": "48 hours in [City] - must do's!"},
            {"type": "post", "topic": "Hidden spots", "caption": "Off the beaten path 🗺️ Save for your trip!"},
            {"type": "story", "topic": "Travel tips", "caption": "Packing hack: Roll, don't fold!"}
        ],
        "lifestyle": [
            {"type": "reel", "topic": "Day in my life", "caption": "Productive morning routine ☀️"},
            {"type": "post", "topic": "Home organization", "caption": "Small changes, big impact"},
            {"type": "story", "topic": "Q&A session", "caption": "Ask me anything! 💬"}
        ]
    }
    
    content_ideas = niche_content.get(niche.lower(), niche_content["lifestyle"])
    
    import random
    from datetime import datetime
    
    days = list(best_times.keys())
    current_day_idx = datetime.now().weekday()
    
    for i, idea in enumerate(content_ideas[:3]):
        day = days[(current_day_idx + i + 1) % 7]
        rec = ContentRecommendation(
            type=idea["type"],
            topic=idea["topic"],
            best_time=f"{day} {best_times[day]}",
            hashtags=hashtags[:10] if hashtags else [f"#{niche}", "#instagood", "#viral"],
            caption_suggestion=idea["caption"]
        )
        recommendations.append(rec)
    
    return recommendations


# ============== API Endpoints ==============

@router.get("/dashboard")
async def get_ai_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive AI analytics dashboard data."""
    user_id = current_user['user_id']
    
    # Get user's Instagram account
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0, "access_token": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    # Get subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    # Get targeting
    targeting = await db.targeting_settings.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    # Get growth logs
    growth_logs = await db.growth_logs.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(30).to_list(30)
    
    # Generate analysis
    growth_analysis = await generate_growth_analysis(account, growth_logs, subscription)
    performance_scores = await calculate_performance_scores(account, targeting)
    content_recommendations = await generate_content_recommendations(account, targeting)
    
    return {
        "account": {
            "username": account.get("username"),
            "followers_count": account.get("followers_count", 0),
            "following_count": account.get("following_count", 0),
            "posts_count": account.get("posts_count", 0),
            "engagement_rate": account.get("engagement_rate", 0),
            "oauth_connected": account.get("oauth_connected", False)
        },
        "growth_analysis": growth_analysis,
        "performance_scores": performance_scores.model_dump(),
        "content_recommendations": [r.model_dump() for r in content_recommendations],
        "has_subscription": subscription is not None,
        "plan": subscription.get("plan") if subscription else None
    }


@router.get("/insights")
async def get_ai_insights(
    current_user: dict = Depends(get_current_user)
):
    """Get AI-generated insights for the account."""
    user_id = current_user['user_id']
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0, "access_token": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    growth_logs = await db.growth_logs.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(30).to_list(30)
    
    analysis = await generate_growth_analysis(account, growth_logs, subscription)
    
    return {
        "insights": analysis.get("insights", []),
        "growth_trend": analysis.get("growth_trend"),
        "avg_daily_growth": analysis.get("avg_daily_growth")
    }


@router.get("/recommendations")
async def get_content_recommendations(
    current_user: dict = Depends(get_current_user)
):
    """Get AI content recommendations."""
    user_id = current_user['user_id']
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    targeting = await db.targeting_settings.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    recommendations = await generate_content_recommendations(account, targeting)
    
    return {
        "recommendations": [r.model_dump() for r in recommendations]
    }


@router.get("/performance")
async def get_performance_scores(
    current_user: dict = Depends(get_current_user)
):
    """Get account performance scores."""
    user_id = current_user['user_id']
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    targeting = await db.targeting_settings.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    scores = await calculate_performance_scores(account, targeting)
    
    return scores.model_dump()


@router.get("/weekly-summary")
async def get_weekly_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get weekly summary with AI analysis."""
    user_id = current_user['user_id']
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0, "access_token": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    # Get this week's growth logs
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    growth_logs = await db.growth_logs.find({
        "user_id": user_id,
        "created_at": {"$gte": week_ago}
    }, {"_id": 0}).to_list(1000)
    
    # Calculate weekly stats
    followers_gained = sum(log.get("followers_gained", 0) for log in growth_logs)
    
    # Get daily breakdown
    daily_stats = {}
    for log in growth_logs:
        date = log.get("created_at", "")[:10]
        if date not in daily_stats:
            daily_stats[date] = 0
        daily_stats[date] += log.get("followers_gained", 0)
    
    # Find best day
    best_day = None
    best_day_growth = 0
    for date, growth in daily_stats.items():
        if growth > best_day_growth:
            best_day = date
            best_day_growth = growth
    
    return {
        "period": f"Last 7 days",
        "followers_gained": followers_gained,
        "avg_daily_growth": round(followers_gained / 7, 1),
        "best_day": best_day,
        "best_day_growth": best_day_growth,
        "daily_breakdown": daily_stats,
        "current_followers": account.get("followers_count", 0),
        "engagement_rate": account.get("engagement_rate", 0)
    }
