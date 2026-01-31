"""
AI Onboarding Recommendations API
User-facing AI recommendations for Instagram account setup
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging
import json

from utils.auth import get_current_user
from utils.ai_service import get_ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai/onboarding", tags=["AI Onboarding"])

# Database reference
db = None

def init_router(database):
    """Initialize router with database connection."""
    global db
    db = database


# ============== Request/Response Models ==============

class OnboardingInput(BaseModel):
    """User input for onboarding recommendations."""
    primary_goal: str = Field(..., pattern="^(brand_awareness|leads_sales|creator_growth)$")
    growth_urgency: str = Field(default="balanced", pattern="^(slow_safe|balanced|faster)$")
    target_country: Optional[str] = None
    competitors: Optional[List[str]] = Field(default_factory=list, max_length=5)


class RecommendedSettings(BaseModel):
    """AI-recommended targeting settings."""
    niche: str
    hashtags: List[str] = Field(default_factory=list)
    similar_accounts: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    growth_intensity: str = "moderate"
    engagement_focus: bool = True


class OnboardingRecommendation(BaseModel):
    """Complete onboarding recommendation response."""
    id: str
    recommended_settings: RecommendedSettings
    suggested_plan: str
    plan_reason: str
    confidence_level: str  # high, medium, low
    growth_expectation: str  # Safe, advisory wording
    safety_notes: str
    ai_analysis_summary: str
    can_edit: bool = True
    created_at: datetime


# AI System Prompt for Onboarding
ONBOARDING_SYSTEM_PROMPT = """## SYSTEM IDENTITY

You are **Adverlyx Intelligence**, an AI assistant helping new users set up their Instagram growth strategy.

## TASK: USER ONBOARDING RECOMMENDATIONS

You are analyzing a new user's Instagram account and preferences to recommend optimal targeting settings.

## OPERATING PRINCIPLES

1. **Safety First** - Always recommend conservative, safe growth settings
2. **No Guarantees** - Never promise specific follower counts or timelines
3. **Advisory Tone** - Provide suggestions, not demands
4. **Personalization** - Tailor recommendations to the user's niche and goals

## LANGUAGE RULES (CRITICAL)

✅ USE phrases like:
- "Based on similar accounts..."
- "Typical growth patterns suggest..."
- "Optimized for account safety..."
- "Results may vary based on engagement and content quality..."

❌ NEVER say:
- Exact follower numbers or guarantees
- Specific timelines ("you'll get X in Y days")
- "Guaranteed" or "will definitely"

## UNCERTAINTY PHRASING (When data is limited)
- "With the available information..."
- "Based on general patterns in [niche]..."
- "Preliminary recommendations suggest..."
- "As more data becomes available, we can refine..."

## CONFIDENCE LEVEL RULES
- "high" → Good data (known niche, engagement rate, account history)
- "medium" → Partial data (username known, niche detected, limited history)  
- "low" → Minimal data (new account, no engagement data)

When confidence is LOW, auto-downgrade tone:
- Use more hedging language
- Recommend "slow" growth intensity
- Suggest "starter" plan to test

## OUTPUT GOVERNANCE
- Max response: 300 words
- Keep analysis_summary to 2-3 sentences max
- Plan recommendation must be soft/advisory, not pushy

## OUTPUT FORMAT

Return a JSON object with these exact keys:
{
    "detected_niche": "string (e.g., fitness, fashion, business, travel, food, lifestyle, tech, art)",
    "recommended_hashtags": ["array of 5-10 relevant hashtags without #"],
    "recommended_similar_accounts": ["array of 3-5 accounts to target without @"],
    "recommended_locations": ["array of 1-3 locations if relevant"],
    "growth_intensity": "slow|moderate|fast",
    "suggested_plan": "starter|growth|pro",
    "plan_reason": "Brief 1-sentence reason for plan suggestion",
    "confidence_level": "high|medium|low",
    "growth_expectation": "Safe advisory text about typical growth (NO numbers/guarantees)",
    "safety_notes": "Brief note about account safety measures",
    "analysis_summary": "2-3 sentence summary of the analysis"
}
"""


async def get_user_plan_tier(user_id: str) -> str:
    """Get user's current plan tier for recommendation depth."""
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    if subscription:
        return subscription.get("plan_id", "free")
    return "free"


async def check_ai_onboarding_enabled() -> bool:
    """Check if AI onboarding is enabled in settings."""
    settings = await db.ai_settings.find_one({"id": "ai_settings_main"}, {"_id": 0})
    if settings:
        return settings.get("onboarding_enabled", True)
    return True


@router.post("/recommendations", response_model=OnboardingRecommendation)
async def get_onboarding_recommendations(
    user_input: OnboardingInput,
    current_user: dict = Depends(get_current_user)
):
    """
    Get AI-powered onboarding recommendations for a new Instagram account.
    Available to all users - depth varies by plan tier.
    """
    user_id = current_user['user_id']
    
    # Check if AI onboarding is enabled
    if not await check_ai_onboarding_enabled():
        raise HTTPException(status_code=503, detail="AI onboarding is temporarily disabled")
    
    # Get user's Instagram account
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id, "status": {"$ne": "disconnected"}},
        {"_id": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="No Instagram account connected")
    
    # Get user's plan tier for recommendation depth
    plan_tier = await get_user_plan_tier(user_id)
    
    # Get actual plans from database
    plans = await db.plans.find({"is_active": True}, {"_id": 0}).to_list(10)
    plan_names = [p.get("name", "").lower() for p in plans if p.get("name")]
    popular_plan = next((p.get("name") for p in plans if p.get("is_popular") or p.get("popular")), plan_names[1] if len(plan_names) > 1 else plan_names[0] if plan_names else "Pro")
    plan_options = "|".join([p.get("name", "").lower() for p in plans]) if plans else "basic|pro|enterprise"
    
    # Build context for AI
    context = f"""
## User Profile
- User ID: {user_id}
- Plan Tier: {plan_tier}
- Account Connected: @{account.get('username', 'unknown')}

## Instagram Account Data (Auto-detected)
- Username: @{account.get('username', 'unknown')}
- Followers: {account.get('followers_count', 'Unknown')}
- Following: {account.get('following_count', 'Unknown')}
- Posts: {account.get('posts_count', 'Unknown')}
- Engagement Rate: {account.get('engagement_rate', 'Unknown')}
- Account Type: {account.get('account_type', 'personal')}

## User Preferences (Selected)
- Primary Goal: {user_input.primary_goal.replace('_', ' ').title()}
- Growth Urgency: {user_input.growth_urgency.replace('_', ' ').title()}
- Target Country: {user_input.target_country or 'Global'}
- Competitors to analyze: {', '.join(user_input.competitors) if user_input.competitors else 'None specified'}

## Available Plans
{chr(10).join([f"- {p.get('name')}: ${p.get('monthly_price', 0)}/mo - {p.get('description', '')} {'(MOST POPULAR)' if p.get('is_popular') or p.get('popular') else ''}" for p in plans])}

IMPORTANT: The suggested_plan MUST be one of: {plan_options}
The most popular plan is: {popular_plan}

## Plan Access Level
- Free/Trial: Basic recommendations
- {plan_names[0].title() if plan_names else 'Basic'}+: Full recommendations  
- {plan_names[-1].title() if plan_names else 'Enterprise'}: Advanced + editable suggestions

Current user is on: {plan_tier} plan

## Task
Analyze this Instagram account and provide personalized onboarding recommendations.
Suggest "{popular_plan}" plan as it's the most popular, unless user needs are very basic or very advanced.
Return a JSON object following the exact format specified.
"""
    
    try:
        ai_service = get_ai_service()
        result = await ai_service.send_message(
            session_id=f"onboarding_{user_id}_{datetime.now(timezone.utc).timestamp()}",
            message=context,
            system_prompt=ONBOARDING_SYSTEM_PROMPT.replace("starter|growth|pro", plan_options).replace("starter", popular_plan.lower())
        )
        
        if not result['success']:
            raise HTTPException(status_code=500, detail="AI analysis failed. Please try again.")
        
        # Parse AI response
        response_text = result['response']
        
        # Extract JSON from response
        try:
            if '```json' in response_text:
                json_str = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                json_str = response_text.split('```')[1].split('```')[0]
            elif '{' in response_text:
                start = response_text.index('{')
                end = response_text.rindex('}') + 1
                json_str = response_text[start:end]
            else:
                json_str = response_text
            
            parsed = json.loads(json_str)
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse AI response: {e}")
            # Provide default recommendations
            parsed = {
                "detected_niche": "lifestyle",
                "recommended_hashtags": ["growth", "instagram", "socialmedia", "content", "creator"],
                "recommended_similar_accounts": [],
                "recommended_locations": [],
                "growth_intensity": "moderate",
                "suggested_plan": "starter",
                "plan_reason": "Great starting point for new accounts",
                "confidence_level": "medium",
                "growth_expectation": "Based on similar accounts, consistent engagement typically leads to gradual organic growth. Results may vary.",
                "safety_notes": "Account safety is prioritized with gradual, natural-looking growth patterns.",
                "analysis_summary": "We've prepared recommendations based on your account profile. You can customize these settings at any time."
            }
        
        # Apply plan-based depth restrictions
        if plan_tier in ["free", "trial"]:
            # Limit for free users
            parsed["recommended_hashtags"] = parsed.get("recommended_hashtags", [])[:5]
            parsed["recommended_similar_accounts"] = []  # No competitor analysis for free
            parsed["can_edit"] = False
        elif plan_tier == "starter":
            parsed["recommended_hashtags"] = parsed.get("recommended_hashtags", [])[:8]
            parsed["recommended_similar_accounts"] = parsed.get("recommended_similar_accounts", [])[:3]
            parsed["can_edit"] = True
        else:  # pro, enterprise
            parsed["can_edit"] = True
        
        # Build response
        import uuid
        recommendation_id = str(uuid.uuid4())
        
        recommended_settings = RecommendedSettings(
            niche=parsed.get("detected_niche", "lifestyle"),
            hashtags=parsed.get("recommended_hashtags", []),
            similar_accounts=parsed.get("recommended_similar_accounts", []),
            locations=parsed.get("recommended_locations", []),
            growth_intensity=parsed.get("growth_intensity", "moderate"),
            engagement_focus=True
        )
        
        recommendation = OnboardingRecommendation(
            id=recommendation_id,
            recommended_settings=recommended_settings,
            suggested_plan=parsed.get("suggested_plan", "starter"),
            plan_reason=parsed.get("plan_reason", "Recommended for your growth goals"),
            confidence_level=parsed.get("confidence_level", "medium"),
            growth_expectation=parsed.get("growth_expectation", "Results vary based on engagement and content quality."),
            safety_notes=parsed.get("safety_notes", "Account safety is our priority."),
            ai_analysis_summary=parsed.get("analysis_summary", "Recommendations based on your account profile."),
            can_edit=parsed.get("can_edit", True),
            created_at=datetime.now(timezone.utc)
        )
        
        # Save recommendation to database
        rec_dict = recommendation.model_dump()
        rec_dict['user_id'] = user_id
        rec_dict['instagram_account_id'] = account.get('id')
        rec_dict['user_input'] = user_input.model_dump()
        rec_dict['raw_ai_response'] = response_text
        rec_dict['created_at'] = rec_dict['created_at'].isoformat()
        await db.ai_onboarding_recommendations.insert_one(rec_dict)
        
        # Log the activity
        from models.ai_intelligence import AIModuleType, AIProvider, AILog
        log = AILog(
            module_type=AIModuleType.GROWTH_PLANNING,
            action="onboarding_recommendations",
            input_summary=f"Onboarding for @{account.get('username')}",
            output_summary=f"Niche: {parsed.get('detected_niche')}, Plan: {parsed.get('suggested_plan')}",
            user_id=user_id,
            provider_used=AIProvider(result['provider']),
            model_used=result['model'],
            response_time_ms=result['response_time_ms'],
            success=True
        )
        log_dict = log.model_dump()
        log_dict['created_at'] = log_dict['created_at'].isoformat()
        await db.ai_logs.insert_one(log_dict)
        
        return recommendation
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Onboarding recommendation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/apply-recommendations/{recommendation_id}")
async def apply_recommendations(
    recommendation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Apply AI recommendations to user's targeting settings."""
    user_id = current_user['user_id']
    
    # Get the recommendation
    recommendation = await db.ai_onboarding_recommendations.find_one(
        {"id": recommendation_id, "user_id": user_id},
        {"_id": 0}
    )
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    # Get user's targeting settings
    targeting = await db.targeting_settings.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not targeting:
        raise HTTPException(status_code=404, detail="Targeting settings not found")
    
    # Apply recommendations
    rec_settings = recommendation.get('recommended_settings', {})
    
    update_data = {
        "niche": rec_settings.get('niche'),
        "hashtags": rec_settings.get('hashtags', []),
        "competitor_accounts": rec_settings.get('similar_accounts', []),  # Map similar_accounts to competitor_accounts
        "locations": rec_settings.get('locations', []),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "ai_configured": True,
        "ai_recommendation_id": recommendation_id
    }
    
    await db.targeting_settings.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    # Save AI analysis summary to user profile
    ai_profile_data = {
        "ai_analysis": {
            "niche": rec_settings.get('niche'),
            "suggested_plan": recommendation.get('suggested_plan'),
            "plan_reason": recommendation.get('plan_reason'),
            "confidence_level": recommendation.get('confidence_level'),
            "growth_expectation": recommendation.get('growth_expectation'),
            "analysis_summary": recommendation.get('ai_analysis_summary'),
            "growth_intensity": rec_settings.get('growth_intensity', 'moderate'),
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": ai_profile_data}
    )
    
    # Mark recommendation as applied
    await db.ai_onboarding_recommendations.update_one(
        {"id": recommendation_id},
        {"$set": {"applied": True, "applied_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "message": "Recommendations applied successfully",
        "applied_settings": rec_settings,
        "ai_analysis": ai_profile_data["ai_analysis"]
    }


@router.get("/history")
async def get_recommendation_history(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get user's recommendation history."""
    user_id = current_user['user_id']
    
    recommendations = await db.ai_onboarding_recommendations.find(
        {"user_id": user_id},
        {"_id": 0, "raw_ai_response": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {"recommendations": recommendations}
