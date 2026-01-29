"""
Admin Affiliate & Referral Management API
Full control over partner programs from admin panel
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

router = APIRouter(prefix="/admin/programs", tags=["Admin Programs"])

db = None

def init_router(database):
    global db
    db = database


# ============== Models ==============

class AffiliateUpdate(BaseModel):
    status: Optional[str] = None  # pending, approved, rejected, suspended
    commission_rate: Optional[float] = None
    notes: Optional[str] = None


class ReferralSettingsUpdate(BaseModel):
    referrer_reward: Optional[float] = None
    referee_discount: Optional[float] = None
    min_payout: Optional[float] = None
    cookie_days: Optional[int] = None
    enabled: Optional[bool] = None


class PayoutRequest(BaseModel):
    affiliate_id: str
    amount: float
    method: str = "paypal"
    notes: Optional[str] = None


# ============== Auth Helper ==============

async def get_admin_user(authorization: str = Header(...)) -> dict:
    from utils.auth import decode_token
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user


# ============== Affiliate Management ==============

@router.get("/affiliates")
async def get_all_affiliates(
    status: Optional[str] = None,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all affiliate applications with optional status filter."""
    query = {}
    if status:
        query["status"] = status
    
    affiliates = await db.affiliates.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get stats
    total = await db.affiliates.count_documents({})
    pending = await db.affiliates.count_documents({"status": "pending"})
    approved = await db.affiliates.count_documents({"status": "approved"})
    
    return {
        "affiliates": affiliates,
        "stats": {
            "total": total,
            "pending": pending,
            "approved": approved,
            "total_earnings": sum(a.get("total_earnings", 0) for a in affiliates)
        }
    }


@router.get("/affiliates/{affiliate_id}")
async def get_affiliate_details(affiliate_id: str, admin: dict = Depends(get_admin_user)):
    """Get detailed affiliate information."""
    affiliate = await db.affiliates.find_one({"id": affiliate_id}, {"_id": 0})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    # Get referral history
    referrals = await db.affiliate_referrals.find(
        {"affiliate_code": affiliate["affiliate_code"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {
        "affiliate": affiliate,
        "referrals": referrals,
        "performance": {
            "total_clicks": len(referrals),
            "conversions": len([r for r in referrals if r.get("converted")]),
            "conversion_rate": len([r for r in referrals if r.get("converted")]) / len(referrals) * 100 if referrals else 0
        }
    }


@router.put("/affiliates/{affiliate_id}")
async def update_affiliate(
    affiliate_id: str,
    update: AffiliateUpdate,
    admin: dict = Depends(get_admin_user)
):
    """Update affiliate status, commission rate, or add notes."""
    affiliate = await db.affiliates.find_one({"id": affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = admin["id"]
    
    if update.status == "approved" and affiliate.get("status") != "approved":
        update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.affiliates.update_one({"id": affiliate_id}, {"$set": update_data})
    
    return {"message": f"Affiliate updated successfully", "updated_fields": list(update_data.keys())}


@router.post("/affiliates/{affiliate_id}/payout")
async def process_affiliate_payout(
    affiliate_id: str,
    payout: PayoutRequest,
    admin: dict = Depends(get_admin_user)
):
    """Process a payout to an affiliate."""
    affiliate = await db.affiliates.find_one({"id": affiliate_id})
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    if affiliate.get("pending_earnings", 0) < payout.amount:
        raise HTTPException(status_code=400, detail="Insufficient pending earnings")
    
    # Record payout
    payout_record = {
        "id": str(__import__("uuid").uuid4()),
        "affiliate_id": affiliate_id,
        "amount": payout.amount,
        "method": payout.method,
        "status": "completed",
        "notes": payout.notes,
        "processed_by": admin["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.affiliate_payouts.insert_one(payout_record)
    
    # Update affiliate earnings
    await db.affiliates.update_one(
        {"id": affiliate_id},
        {
            "$inc": {
                "pending_earnings": -payout.amount,
                "paid_earnings": payout.amount
            }
        }
    )
    
    return {"message": "Payout processed successfully", "payout_id": payout_record["id"]}


# ============== Referral Management ==============

@router.get("/referrals")
async def get_all_referrals(
    status: Optional[str] = None,
    limit: int = 50,
    admin: dict = Depends(get_admin_user)
):
    """Get all user referrals."""
    query = {}
    if status:
        query["status"] = status
    
    referrals = await db.user_referrals.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Enrich with user info
    for ref in referrals:
        referrer = await db.users.find_one({"id": ref.get("referrer_id")}, {"_id": 0, "name": 1, "email": 1})
        if referrer:
            ref["referrer_name"] = referrer.get("name")
            ref["referrer_email"] = referrer.get("email")
    
    # Stats
    total = await db.user_referrals.count_documents({})
    completed = await db.user_referrals.count_documents({"status": "completed"})
    total_rewards = sum(r.get("reward", 0) for r in referrals if r.get("status") == "completed")
    
    return {
        "referrals": referrals,
        "stats": {
            "total": total,
            "completed": completed,
            "pending": total - completed,
            "total_rewards_paid": total_rewards
        }
    }


@router.put("/referrals/{referral_id}/complete")
async def complete_referral(referral_id: str, admin: dict = Depends(get_admin_user)):
    """Mark a referral as completed and credit the reward."""
    referral = await db.user_referrals.find_one({"id": referral_id})
    
    if not referral:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    if referral.get("status") == "completed":
        raise HTTPException(status_code=400, detail="Referral already completed")
    
    # Update referral status
    await db.user_referrals.update_one(
        {"id": referral_id},
        {
            "$set": {
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "completed_by": admin["id"]
            }
        }
    )
    
    # Credit referrer
    reward = referral.get("reward", 10.0)
    await db.users.update_one(
        {"id": referral["referrer_id"]},
        {"$inc": {"credit_balance": reward}}
    )
    
    return {"message": "Referral completed, reward credited", "reward": reward}


# ============== Program Settings ==============

@router.get("/settings")
async def get_program_settings(admin: dict = Depends(get_admin_user)):
    """Get all affiliate and referral program settings."""
    
    # Get from feature_configurations or site_settings
    affiliate_settings = await db.site_settings.find_one({"type": "affiliate"}, {"_id": 0})
    referral_settings = await db.site_settings.find_one({"type": "referral"}, {"_id": 0})
    
    return {
        "affiliate": affiliate_settings or {
            "enabled": True,
            "commission_rate": 20.0,
            "cookie_days": 30,
            "min_payout": 50.0,
            "payment_methods": ["paypal", "bank_transfer"],
            "auto_approve": False
        },
        "referral": referral_settings or {
            "enabled": True,
            "referrer_reward": 10.0,
            "referee_discount": 20.0,
            "reward_type": "credit",
            "require_subscription": True
        }
    }


@router.put("/settings/affiliate")
async def update_affiliate_settings(
    settings: dict,
    admin: dict = Depends(get_admin_user)
):
    """Update affiliate program settings."""
    settings["type"] = "affiliate"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    settings["updated_by"] = admin["id"]
    
    await db.site_settings.update_one(
        {"type": "affiliate"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Affiliate settings updated"}


@router.put("/settings/referral")
async def update_referral_settings(
    settings: dict,
    admin: dict = Depends(get_admin_user)
):
    """Update referral program settings."""
    settings["type"] = "referral"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    settings["updated_by"] = admin["id"]
    
    await db.site_settings.update_one(
        {"type": "referral"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Referral settings updated"}


# ============== Analytics ==============

@router.get("/analytics")
async def get_program_analytics(
    days: int = 30,
    admin: dict = Depends(get_admin_user)
):
    """Get affiliate and referral program analytics."""
    from datetime import timedelta
    
    start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    
    # Affiliate stats
    affiliate_referrals = await db.affiliate_referrals.find(
        {"created_at": {"$gte": start_date}}
    ).to_list(1000)
    
    affiliate_payouts = await db.affiliate_payouts.find(
        {"created_at": {"$gte": start_date}}
    ).to_list(1000)
    
    # User referral stats
    user_referrals = await db.user_referrals.find(
        {"created_at": {"$gte": start_date}}
    ).to_list(1000)
    
    return {
        "period_days": days,
        "affiliate_program": {
            "clicks": len(affiliate_referrals),
            "conversions": len([r for r in affiliate_referrals if r.get("converted")]),
            "revenue_generated": sum(r.get("order_amount", 0) for r in affiliate_referrals if r.get("converted")),
            "commissions_paid": sum(p.get("amount", 0) for p in affiliate_payouts)
        },
        "referral_program": {
            "total_referrals": len(user_referrals),
            "successful": len([r for r in user_referrals if r.get("status") == "completed"]),
            "rewards_credited": sum(r.get("reward", 0) for r in user_referrals if r.get("status") == "completed")
        }
    }
