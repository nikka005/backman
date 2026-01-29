from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime, timezone, timedelta
import random

from models.cms import PlatformStats, Testimonial, FAQ
from models.subscription import PLAN_CONFIG, PlanType

router = APIRouter(prefix="/public", tags=["Public"])

db = None

def init_router(database):
    global db
    db = database


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
    faqs = await db.cms_content.find_one({"key": "faqs"}, {"_id": 0}) if db else None
    
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
    """Get public pricing plans."""
    plans = []
    for plan_type, details in PLAN_CONFIG.items():
        plans.append({
            "id": plan_type.value,
            "name": details.name,
            "monthly_price": details.monthly_price,
            "yearly_price": details.yearly_price,
            "followers_min": details.followers_min,
            "followers_max": details.followers_max,
            "features": details.features,
            "popular": plan_type == PlanType.PRO
        })
    return plans


@router.get("/reviews")
async def get_reviews():
    """Get platform reviews."""
    return [
        {"platform": "Trustpilot", "rating": "4.8/5", "reviews": "96+"},
        {"platform": "G2", "rating": "4.7/5", "reviews": "192+"},
        {"platform": "Capterra", "rating": "4.9/5", "reviews": "634+"},
        {"platform": "GetApp", "rating": "4.7/5", "reviews": "180+"}
    ]
