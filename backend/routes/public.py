from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone, timedelta
import random

from models.cms import PlatformStats, Testimonial, FAQ
from models.subscription import PLAN_CONFIG, PlanType
from models.settings import SiteSettings, BrandingSettings, UISettings, FeatureToggle, HeroContent, StatsContent, PromoBanner

router = APIRouter(prefix="/public", tags=["Public"])

db = None

def init_router(database):
    global db
    db = database


@router.get("/settings")
async def get_public_settings():
    """Get public site settings (branding, UI, features, content)."""
    settings = await db.site_settings.find_one({}, {"_id": 0}) if db is not None else None
    
    if not settings:
        # Return defaults
        default = SiteSettings()
        return default.model_dump()
    
    return settings


@router.get("/branding")
async def get_public_branding():
    """Get branding settings for frontend."""
    settings = await db.site_settings.find_one({}, {"branding": 1, "_id": 0}) if db is not None else None
    if settings and settings.get('branding'):
        return settings['branding']
    return BrandingSettings().model_dump()


@router.get("/ui")
async def get_public_ui():
    """Get UI settings for frontend."""
    settings = await db.site_settings.find_one({}, {"ui": 1, "_id": 0}) if db is not None else None
    if settings and settings.get('ui'):
        return settings['ui']
    return UISettings().model_dump()


@router.get("/features")
async def get_public_features():
    """Get feature toggles for frontend."""
    settings = await db.site_settings.find_one({}, {"features": 1, "_id": 0}) if db is not None else None
    if settings and settings.get('features'):
        return settings['features']
    return FeatureToggle().model_dump()


@router.get("/hero")
async def get_public_hero():
    """Get hero section content."""
    settings = await db.site_settings.find_one({}, {"hero": 1, "_id": 0}) if db is not None else None
    if settings and settings.get('hero'):
        return settings['hero']
    return HeroContent().model_dump()


@router.get("/promo-banner")
async def get_public_promo_banner():
    """Get promo banner settings."""
    settings = await db.site_settings.find_one({}, {"promo_banner": 1, "_id": 0}) if db is not None else None
    if settings and settings.get('promo_banner'):
        return settings['promo_banner']
    return PromoBanner().model_dump()


@router.get("/stats")
async def get_platform_stats():
    """Get public platform statistics."""
    # Try to get from CMS, else return defaults
    cms_stats = await db.cms_content.find_one({"key": "platform_stats"}, {"_id": 0}) if db is not None else None
    
    if cms_stats and cms_stats.get('content'):
        return cms_stats['content']
    
    return {
        "happy_users": "55,000+",
        "new_fans_monthly": "~4,500",
        "hours_saved": "7M+",
        "satisfaction_score": "9.8/10"
    }


@router.get("/testimonials")
async def get_testimonials():
    """Get public testimonials."""
    # Try to get from database
    testimonials = await db.cms_content.find_one({"key": "testimonials"}, {"_id": 0}) if db is not None else None
    
    if testimonials and testimonials.get('content'):
        return testimonials['content']
    
    # Return default mock testimonials
    return [
        {
            "id": "1",
            "name": "Sarah Mitchell",
            "handle": "@sarahmitchell",
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
            "followers": "214K",
            "growth": "+47K",
            "memberSince": "Jan 2024",
            "category": "Influencer",
            "quote": "Adverlyx transformed my Instagram presence completely. Gained 40K real followers in 3 months!"
        },
        {
            "id": "2",
            "name": "Marcus Johnson",
            "handle": "@marcusjohnson",
            "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop",
            "followers": "892K",
            "growth": "+156K",
            "memberSince": "Mar 2023",
            "category": "Entrepreneur",
            "quote": "The AI targeting is incredibly accurate. My engagement rate tripled within weeks."
        },
        {
            "id": "3",
            "name": "Elena Rodriguez",
            "handle": "@elenarodriguez",
            "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
            "followers": "567K",
            "growth": "+89K",
            "memberSince": "Nov 2023",
            "category": "E-commerce",
            "quote": "Best investment for our brand. Real followers who actually buy our products."
        }
    ]


@router.get("/faqs")
async def get_faqs():
    """Get public FAQs."""
    faqs = await db.cms_content.find_one({"key": "faqs"}, {"_id": 0}) if db is not None else None
    
    if faqs and faqs.get('content'):
        return faqs['content']
    
    # Return default FAQs
    return [
        {
            "question": "Who should use Adverlyx Digital?",
            "answer": "Adverlyx is for anyone who wants to grow their Instagram account organically. Whether you're a business, influencer, or just someone who wants to grow their personal account, Adverlyx is the best Instagram growth service for you."
        },
        {
            "question": "What is required to use Adverlyx?",
            "answer": "All you need is an Instagram account. You can use Adverlyx on your personal account, business account, or even an influencer account."
        },
        {
            "question": "How many followers can I get with Adverlyx?",
            "answer": "Adverlyx is designed to help you grow your account organically. You can expect to grow by at least 1,000 followers per month with our Basic plan, and more with higher tiers."
        },
        {
            "question": "Is Adverlyx safe to use?",
            "answer": "Yes! Adverlyx is completely safe to use. We use organic growth strategies that comply with Instagram's terms of service."
        },
        {
            "question": "How long does it take to see results?",
            "answer": "You can expect to see results within the first 24 hours. However, it can take up to 7 days to see the full potential of our AI growth engine."
        },
        {
            "question": "How do I cancel my subscription?",
            "answer": "You can cancel your subscription at any time through the billing page on your dashboard. No hidden fees or complicated processes."
        }
    ]


@router.get("/plans")
async def get_pricing_plans():
    """Get public pricing plans from database."""
    # First try to get dynamic plans from database
    if db is not None:
        plans = await db.plans.find(
            {"is_active": True, "is_hidden": {"$ne": True}},
            {"_id": 0}
        ).sort("display_order", 1).to_list(100)
        
        if plans:
            return plans
    
    # Fallback to static plans
    result = []
    for plan_type, details in PLAN_CONFIG.items():
        result.append({
            "id": plan_type.value,
            "name": details.name,
            "slug": plan_type.value,
            "description": f"{'Perfect for getting started' if plan_type.value == 'basic' else 'Most popular choice' if plan_type.value == 'pro' else 'For serious growth'}",
            "monthly_price": details.monthly_price,
            "yearly_price": details.yearly_price,
            "followers_min": details.followers_min,
            "followers_max": details.followers_max,
            "feature_list": details.features,
            "is_popular": plan_type == PlanType.PRO
        })
    return result


@router.get("/reviews")
async def get_reviews():
    """Get platform reviews."""
    return [
        {"platform": "Trustpilot", "rating": "4.8/5", "reviews": "96+"},
        {"platform": "G2", "rating": "4.7/5", "reviews": "192+"},
        {"platform": "Capterra", "rating": "4.9/5", "reviews": "634+"},
        {"platform": "GetApp", "rating": "4.7/5", "reviews": "180+"}
    ]


@router.get("/social-links")
async def get_public_social_links():
    """Get social media links for footer/public pages."""
    settings = await db.site_settings.find_one({}, {"_id": 0}) if db is not None else None
    
    if not settings:
        return {
            "instagram": "https://instagram.com/adverlyx",
            "twitter": "https://twitter.com/adverlyx",
            "linkedin": "https://linkedin.com/company/adverlyx",
            "youtube": "",
            "facebook": "",
            "tiktok": "",
            "pinterest": "",
            "discord": "",
            "telegram": ""
        }
    
    return {
        "instagram": settings.get("social_instagram", ""),
        "twitter": settings.get("social_twitter", ""),
        "linkedin": settings.get("social_linkedin", ""),
        "youtube": settings.get("social_youtube", ""),
        "facebook": settings.get("social_facebook", ""),
        "tiktok": settings.get("social_tiktok", ""),
        "pinterest": settings.get("social_pinterest", ""),
        "discord": settings.get("social_discord", ""),
        "telegram": settings.get("social_telegram", "")
    }


@router.get("/feature-matrix")
async def get_public_feature_matrix():
    """Get the feature comparison matrix for pricing page."""
    if db is not None:
        matrix = await db.feature_matrix.find({}, {"_id": 0}).sort("category", 1).to_list(100)
        if matrix:
            return matrix
    
    # Return defaults
    return [
        {"feature_key": "guaranteed_followers", "feature_name": "Guaranteed Followers/Month", "category": "growth", "is_boolean": False, "basic_value": "1,000-1,500", "pro_value": "2,500-3,500", "enterprise_value": "5,000+"},
        {"feature_key": "ai_targeting", "feature_name": "AI-Powered Targeting", "category": "targeting", "is_boolean": True, "basic_value": "Yes", "pro_value": "Yes", "enterprise_value": "Yes"},
        {"feature_key": "analytics_dashboard", "feature_name": "Real-Time Analytics", "category": "analytics", "is_boolean": True, "basic_value": "Yes", "pro_value": "Yes", "enterprise_value": "Yes"},
        {"feature_key": "ai_engine", "feature_name": "AI Growth Engine", "category": "advanced", "is_boolean": True, "basic_value": "No", "pro_value": "Yes", "enterprise_value": "Yes"},
        {"feature_key": "dedicated_manager", "feature_name": "Dedicated Account Manager", "category": "support", "is_boolean": True, "basic_value": "No", "pro_value": "No", "enterprise_value": "Yes"},
        {"feature_key": "api_access", "feature_name": "API Access", "category": "advanced", "is_boolean": True, "basic_value": "No", "pro_value": "No", "enterprise_value": "Yes"},
    ]



@router.get("/localized-pricing")
async def get_localized_pricing(request: Request):
    """
    Get pricing localized to client's country based on IP.
    Returns currency, prices, and recommended payment provider.
    """
    from fastapi import Request
    from utils.currency import get_localized_pricing, BASE_PLAN_PRICES_USD
    from utils.security import get_client_ip
    
    client_ip = get_client_ip(request)
    
    # Get localized pricing
    pricing = await get_localized_pricing(client_ip, BASE_PLAN_PRICES_USD)
    
    # Get plans from database
    plans = []
    if db is not None:
        db_plans = await db.plans.find({"is_active": True}, {"_id": 0}).to_list(10)
        if db_plans:
            for plan in db_plans:
                plan_key = plan.get("name", "").lower()
                monthly_key = f"{plan_key}_monthly"
                yearly_key = f"{plan_key}_yearly"
                
                plans.append({
                    "id": plan.get("id"),
                    "name": plan.get("name"),
                    "description": plan.get("description"),
                    "monthly_price": pricing["prices"].get(monthly_key, plan.get("monthly_price", 0)),
                    "yearly_price": pricing["prices"].get(yearly_key, plan.get("yearly_price", 0)),
                    "features": plan.get("features", []),
                    "is_popular": plan.get("is_popular", False)
                })
    
    # If no plans in DB, use defaults
    if not plans:
        plans = [
            {
                "id": "basic",
                "name": "Basic",
                "description": "Perfect for getting started",
                "monthly_price": pricing["prices"].get("basic_monthly", 49),
                "yearly_price": pricing["prices"].get("basic_yearly", 348),
                "features": ["1,000-1,500 followers/month", "AI Targeting", "Basic Analytics"],
                "is_popular": False
            },
            {
                "id": "pro",
                "name": "Pro",
                "description": "Most popular for growing accounts",
                "monthly_price": pricing["prices"].get("pro_monthly", 69),
                "yearly_price": pricing["prices"].get("pro_yearly", 492),
                "features": ["2,500-3,500 followers/month", "Advanced AI", "Priority Support"],
                "is_popular": True
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "For serious influencers & agencies",
                "monthly_price": pricing["prices"].get("enterprise_monthly", 149),
                "yearly_price": pricing["prices"].get("enterprise_yearly", 1188),
                "features": ["5,000+ followers/month", "Dedicated Manager", "API Access"],
                "is_popular": False
            }
        ]
    
    return {
        "country_code": pricing["country_code"],
        "currency": pricing["currency"],
        "currency_symbol": pricing["currency_symbol"],
        "currency_name": pricing["currency_name"],
        "payment_provider": pricing["payment_provider"],
        "exchange_rate": pricing["exchange_rate"],
        "plans": plans
    }
