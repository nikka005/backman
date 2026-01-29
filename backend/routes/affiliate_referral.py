"""
Affiliate & Referral Program API
Commission-based partner and user referral system
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import secrets

from utils.auth import get_current_user

router = APIRouter(prefix="/programs", tags=["Affiliate & Referral"])

db = None

def init_router(database):
    global db
    db = database


# ============== Models ==============

class AffiliateApplication(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    website: Optional[str] = None
    social_media: Optional[str] = None
    audience_size: Optional[str] = None
    promotion_methods: str
    why_join: str


class AffiliateProfile(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    email: str
    affiliate_code: str
    commission_rate: float = 20.0  # 20% default
    status: str = "pending"  # pending, approved, rejected, suspended
    total_referrals: int = 0
    total_earnings: float = 0
    pending_earnings: float = 0
    paid_earnings: float = 0
    created_at: str
    approved_at: Optional[str] = None


class ReferralInfo(BaseModel):
    referral_code: str
    referral_link: str
    total_referrals: int = 0
    successful_referrals: int = 0
    pending_rewards: float = 0
    total_rewards: float = 0


class ReferralReward(BaseModel):
    referrer_reward: float = 10.0  # $10 credit for referrer
    referee_discount: float = 20.0  # 20% off first month for referee


# ============== Affiliate Endpoints ==============

@router.post("/affiliate/apply")
async def apply_for_affiliate(application: AffiliateApplication):
    """Apply to become an affiliate partner."""
    
    # Check if already applied
    existing = await db.affiliates.find_one({"email": application.email})
    if existing:
        raise HTTPException(status_code=400, detail="Application already exists for this email")
    
    # Generate unique affiliate code
    affiliate_code = f"ADV{secrets.token_hex(4).upper()}"
    
    affiliate = {
        "id": str(uuid.uuid4()),
        "name": application.name,
        "email": application.email,
        "website": application.website,
        "social_media": application.social_media,
        "audience_size": application.audience_size,
        "promotion_methods": application.promotion_methods,
        "why_join": application.why_join,
        "affiliate_code": affiliate_code,
        "commission_rate": 20.0,
        "status": "pending",
        "total_referrals": 0,
        "total_earnings": 0,
        "pending_earnings": 0,
        "paid_earnings": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "approved_at": None
    }
    
    await db.affiliates.insert_one(affiliate)
    
    return {
        "message": "Application submitted successfully! We'll review and get back to you within 48 hours.",
        "application_id": affiliate["id"]
    }


@router.get("/affiliate/status/{email}")
async def check_affiliate_status(email: str):
    """Check affiliate application status."""
    affiliate = await db.affiliates.find_one({"email": email}, {"_id": 0})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="No application found for this email")
    
    return {
        "status": affiliate["status"],
        "affiliate_code": affiliate["affiliate_code"] if affiliate["status"] == "approved" else None,
        "commission_rate": affiliate["commission_rate"] if affiliate["status"] == "approved" else None,
        "applied_at": affiliate["created_at"]
    }


@router.get("/affiliate/dashboard")
async def get_affiliate_dashboard(current_user: dict = Depends(get_current_user)):
    """Get affiliate dashboard data (for approved affiliates)."""
    user_id = current_user["user_id"]
    
    # Check if user is an affiliate
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    affiliate = await db.affiliates.find_one(
        {"email": user.get("email"), "status": "approved"},
        {"_id": 0}
    )
    
    if not affiliate:
        raise HTTPException(status_code=403, detail="You are not an approved affiliate")
    
    # Get referral stats
    referrals = await db.affiliate_referrals.find(
        {"affiliate_code": affiliate["affiliate_code"]}
    ).to_list(100)
    
    completed_referrals = [r for r in referrals if r.get("status") == "completed"]
    
    return {
        "affiliate_code": affiliate["affiliate_code"],
        "affiliate_link": f"https://adverlyx.com/?ref={affiliate['affiliate_code']}",
        "commission_rate": affiliate["commission_rate"],
        "stats": {
            "total_clicks": len(referrals),
            "total_signups": len([r for r in referrals if r.get("signed_up")]),
            "total_conversions": len(completed_referrals),
            "pending_earnings": affiliate["pending_earnings"],
            "total_earnings": affiliate["total_earnings"],
            "paid_earnings": affiliate["paid_earnings"]
        },
        "recent_referrals": [
            {
                "date": r["created_at"],
                "status": r["status"],
                "commission": r.get("commission", 0)
            }
            for r in referrals[-10:]
        ]
    }


@router.post("/affiliate/track/{affiliate_code}")
async def track_affiliate_click(affiliate_code: str, visitor_id: Optional[str] = None):
    """Track an affiliate referral click."""
    affiliate = await db.affiliates.find_one(
        {"affiliate_code": affiliate_code, "status": "approved"}
    )
    
    if not affiliate:
        return {"tracked": False, "reason": "Invalid affiliate code"}
    
    # Record the click
    click = {
        "id": str(uuid.uuid4()),
        "affiliate_code": affiliate_code,
        "visitor_id": visitor_id or str(uuid.uuid4()),
        "status": "clicked",
        "signed_up": False,
        "converted": False,
        "commission": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.affiliate_referrals.insert_one(click)
    
    return {"tracked": True, "visitor_id": click["visitor_id"]}


# ============== Referral Program Endpoints ==============

@router.get("/referral/info")
async def get_referral_info(current_user: dict = Depends(get_current_user)):
    """Get user's referral information."""
    user_id = current_user["user_id"]
    
    # Get or create referral code for user
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user.get("referral_code"):
        # Generate referral code
        referral_code = f"REF{secrets.token_hex(4).upper()}"
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"referral_code": referral_code}}
        )
    else:
        referral_code = user["referral_code"]
    
    # Get referral stats
    referrals = await db.user_referrals.find(
        {"referrer_id": user_id}
    ).to_list(100)
    
    successful = [r for r in referrals if r.get("status") == "completed"]
    pending_rewards = sum(r.get("reward", 0) for r in referrals if r.get("status") == "pending")
    total_rewards = sum(r.get("reward", 0) for r in successful)
    
    return ReferralInfo(
        referral_code=referral_code,
        referral_link=f"https://adverlyx.com/?ref={referral_code}",
        total_referrals=len(referrals),
        successful_referrals=len(successful),
        pending_rewards=pending_rewards,
        total_rewards=total_rewards
    )


@router.get("/referral/rewards")
async def get_referral_rewards():
    """Get current referral reward structure."""
    # Could be dynamic from admin settings
    settings = await db.site_settings.find_one({"type": "referral"}, {"_id": 0})
    
    if settings:
        return ReferralReward(
            referrer_reward=settings.get("referrer_reward", 10.0),
            referee_discount=settings.get("referee_discount", 20.0)
        )
    
    return ReferralReward()


@router.post("/referral/track/{referral_code}")
async def track_referral(referral_code: str, referee_email: Optional[str] = None):
    """Track a user referral."""
    
    # Find referrer
    referrer = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
    
    if not referrer:
        return {"tracked": False, "reason": "Invalid referral code"}
    
    # Record referral
    referral = {
        "id": str(uuid.uuid4()),
        "referrer_id": referrer["id"],
        "referral_code": referral_code,
        "referee_email": referee_email,
        "status": "pending",
        "reward": 10.0,  # Default reward
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_referrals.insert_one(referral)
    
    return {"tracked": True, "referral_id": referral["id"]}


@router.get("/referral/history")
async def get_referral_history(current_user: dict = Depends(get_current_user)):
    """Get user's referral history."""
    user_id = current_user["user_id"]
    
    referrals = await db.user_referrals.find(
        {"referrer_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return {"referrals": referrals}


# ============== Public Info ==============

@router.get("/affiliate/info")
async def get_affiliate_program_info():
    """Get public affiliate program information."""
    return {
        "program_name": "Adverlyx Affiliate Program",
        "commission_rate": "20%",
        "cookie_duration": "30 days",
        "minimum_payout": "$50",
        "payment_methods": ["PayPal", "Bank Transfer"],
        "benefits": [
            "20% commission on all referred sales",
            "30-day cookie duration",
            "Real-time tracking dashboard",
            "Monthly payouts",
            "Dedicated affiliate support",
            "Marketing materials provided"
        ],
        "requirements": [
            "Active website or social media presence",
            "Relevant audience in social media/marketing niche",
            "No spam or misleading promotions",
            "Compliance with program terms"
        ]
    }


@router.get("/referral/program-info")
async def get_referral_program_info():
    """Get public referral program information."""
    return {
        "program_name": "Adverlyx Referral Program",
        "referrer_reward": "$10 credit",
        "referee_discount": "20% off first month",
        "how_it_works": [
            "Share your unique referral link with friends",
            "When they sign up and subscribe, you both win!",
            "You get $10 credit, they get 20% off",
            "No limit on referrals"
        ],
        "terms": [
            "Referee must be a new user",
            "Reward credited after referee's first payment",
            "Credits can be used towards subscription",
            "Credits never expire"
        ]
    }
