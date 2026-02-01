"""
Automated Subscription Renewal System
Handles automatic renewals, retry logic, and notifications
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging
import uuid

from utils.auth import get_current_user
from models.user import UserRole
from utils.email import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscription-renewals", tags=["Subscription Renewals"])

db = None

def init_router(database):
    global db
    db = database


# ============== Renewal Processing ==============

async def process_subscription_renewal(subscription_id: str) -> dict:
    """Process a single subscription renewal."""
    subscription = await db.subscriptions.find_one({"id": subscription_id}, {"_id": 0})
    
    if not subscription:
        return {"success": False, "error": "Subscription not found"}
    
    if subscription.get("status") != "active":
        return {"success": False, "error": "Subscription not active"}
    
    user = await db.users.find_one({"id": subscription["user_id"]}, {"_id": 0})
    if not user:
        return {"success": False, "error": "User not found"}
    
    # Get plan details
    plan = await db.plans.find_one({"slug": subscription.get("plan")}, {"_id": 0})
    if not plan:
        # Fallback to hardcoded pricing
        amount = subscription.get("amount", 49)
    else:
        if subscription.get("billing_cycle") == "yearly":
            amount = plan.get("yearly_price", 41) * 12
        else:
            amount = plan.get("monthly_price", 49)
    
    # Create renewal payment record
    renewal_payment = {
        "id": f"renewal_{uuid.uuid4().hex[:16]}",
        "subscription_id": subscription_id,
        "user_id": subscription["user_id"],
        "user_email": user.get("email"),
        "amount": amount,
        "currency": subscription.get("currency", "usd"),
        "type": "renewal",
        "status": "pending",
        "attempt_number": 1,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.renewal_payments.insert_one(renewal_payment)
    
    # In production, this would integrate with Stripe/Razorpay for actual payment
    # For now, we'll simulate successful renewal
    
    # Update subscription dates
    now = datetime.now(timezone.utc)
    if subscription.get("billing_cycle") == "yearly":
        next_billing = now + timedelta(days=365)
    else:
        next_billing = now + timedelta(days=30)
    
    await db.subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {
            "next_billing_date": next_billing.isoformat(),
            "last_renewal_date": now.isoformat(),
            "renewal_count": subscription.get("renewal_count", 0) + 1,
            "updated_at": now.isoformat()
        }}
    )
    
    # Update renewal payment status
    await db.renewal_payments.update_one(
        {"id": renewal_payment["id"]},
        {"$set": {
            "status": "success",
            "processed_at": now.isoformat()
        }}
    )
    
    # Create payment record for tracking
    payment_record = {
        "id": f"pay_renewal_{uuid.uuid4().hex[:16]}",
        "user_id": subscription["user_id"],
        "subscription_id": subscription_id,
        "renewal_payment_id": renewal_payment["id"],
        "amount": amount,
        "currency": subscription.get("currency", "usd"),
        "status": "success",
        "provider": "auto_renewal",
        "payment_method": "stored_card",
        "plan": subscription.get("plan"),
        "billing": subscription.get("billing_cycle"),
        "created_at": now.isoformat()
    }
    await db.payments.insert_one(payment_record)
    
    # Send renewal confirmation email
    await send_renewal_email(user, subscription, amount)
    
    logger.info(f"Subscription {subscription_id} renewed successfully for ${amount}")
    
    return {
        "success": True,
        "subscription_id": subscription_id,
        "amount": amount,
        "next_billing_date": next_billing.isoformat()
    }


async def send_renewal_email(user: dict, subscription: dict, amount: float):
    """Send renewal confirmation email."""
    try:
        subject = "Your Adverlyx Subscription Has Been Renewed"
        body = f"""
        <h2>Subscription Renewed Successfully!</h2>
        <p>Hi {user.get('name', 'there')},</p>
        <p>Your <strong>{subscription.get('plan', 'Pro').title()}</strong> subscription has been automatically renewed.</p>
        <p><strong>Amount charged:</strong> ${amount:.2f}</p>
        <p><strong>Billing cycle:</strong> {subscription.get('billing_cycle', 'monthly').title()}</p>
        <p>Thank you for continuing to grow with Adverlyx!</p>
        <br>
        <p>Best regards,<br>The Adverlyx Team</p>
        """
        await send_email(user["email"], subject, body)
    except Exception as e:
        logger.error(f"Failed to send renewal email: {e}")


async def process_failed_renewal(subscription_id: str, error: str):
    """Handle failed renewal - retry logic."""
    subscription = await db.subscriptions.find_one({"id": subscription_id}, {"_id": 0})
    if not subscription:
        return
    
    retry_count = subscription.get("renewal_retry_count", 0) + 1
    max_retries = 3
    
    if retry_count >= max_retries:
        # Mark subscription as past_due
        await db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": {
                "status": "past_due",
                "renewal_retry_count": retry_count,
                "last_renewal_error": error,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Send warning email
        user = await db.users.find_one({"id": subscription["user_id"]}, {"_id": 0})
        if user:
            await send_payment_failed_email(user, subscription)
    else:
        # Schedule retry
        next_retry = datetime.now(timezone.utc) + timedelta(days=retry_count)
        await db.subscriptions.update_one(
            {"id": subscription_id},
            {"$set": {
                "renewal_retry_count": retry_count,
                "next_renewal_retry": next_retry.isoformat(),
                "last_renewal_error": error,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )


async def send_payment_failed_email(user: dict, subscription: dict):
    """Send payment failed notification."""
    try:
        subject = "Action Required: Payment Failed for Your Adverlyx Subscription"
        body = f"""
        <h2>Payment Failed</h2>
        <p>Hi {user.get('name', 'there')},</p>
        <p>We were unable to process the renewal payment for your <strong>{subscription.get('plan', 'Pro').title()}</strong> subscription.</p>
        <p>Please update your payment method to continue enjoying Adverlyx services.</p>
        <p><a href="https://adverlyx.com/dashboard?tab=billing">Update Payment Method</a></p>
        <br>
        <p>Best regards,<br>The Adverlyx Team</p>
        """
        await send_email(user["email"], subject, body)
    except Exception as e:
        logger.error(f"Failed to send payment failed email: {e}")


# ============== API Endpoints ==============

@router.get("/due")
async def get_due_renewals(current_user: dict = Depends(get_current_user)):
    """Get subscriptions due for renewal (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    
    # Find subscriptions due for renewal (within next 24 hours)
    due_date = now + timedelta(days=1)
    
    subscriptions = await db.subscriptions.find({
        "status": "active",
        "next_billing_date": {"$lte": due_date.isoformat()}
    }, {"_id": 0}).to_list(100)
    
    return {
        "due_count": len(subscriptions),
        "subscriptions": subscriptions
    }


@router.post("/process/{subscription_id}")
async def process_renewal(
    subscription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Manually process a renewal (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await process_subscription_renewal(subscription_id)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.post("/process-all")
async def process_all_due_renewals(current_user: dict = Depends(get_current_user)):
    """Process all due renewals (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    
    subscriptions = await db.subscriptions.find({
        "status": "active",
        "next_billing_date": {"$lte": now.isoformat()}
    }, {"_id": 0}).to_list(100)
    
    results = {
        "processed": 0,
        "successful": 0,
        "failed": 0,
        "errors": []
    }
    
    for sub in subscriptions:
        result = await process_subscription_renewal(sub["id"])
        results["processed"] += 1
        
        if result["success"]:
            results["successful"] += 1
        else:
            results["failed"] += 1
            results["errors"].append({
                "subscription_id": sub["id"],
                "error": result.get("error", "Unknown error")
            })
    
    return results


@router.get("/history")
async def get_renewal_history(
    subscription_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get renewal payment history."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        # Regular users can only see their own renewals
        query = {"user_id": current_user["user_id"]}
    else:
        query = {}
        if subscription_id:
            query["subscription_id"] = subscription_id
    
    renewals = await db.renewal_payments.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"renewals": renewals}


@router.get("/settings")
async def get_renewal_settings(current_user: dict = Depends(get_current_user)):
    """Get renewal settings (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings = await db.site_settings.find_one(
        {"type": "renewal_settings"},
        {"_id": 0}
    )
    
    if not settings:
        settings = {
            "type": "renewal_settings",
            "auto_renewal_enabled": True,
            "max_retry_attempts": 3,
            "retry_interval_days": 1,
            "grace_period_days": 7,
            "send_reminder_days_before": [7, 3, 1],
            "send_failed_notification": True
        }
        await db.site_settings.insert_one(settings)
    
    return settings


@router.put("/settings")
async def update_renewal_settings(
    settings: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update renewal settings (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    settings["type"] = "renewal_settings"
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    settings["updated_by"] = current_user["user_id"]
    
    await db.site_settings.update_one(
        {"type": "renewal_settings"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Settings updated", "settings": settings}


@router.get("/upcoming-renewals")
async def get_upcoming_renewals(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming renewals for the next N days (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=days)
    
    subscriptions = await db.subscriptions.find({
        "status": "active",
        "next_billing_date": {
            "$gte": now.isoformat(),
            "$lte": end_date.isoformat()
        }
    }, {"_id": 0}).to_list(100)
    
    # Group by date
    by_date = {}
    for sub in subscriptions:
        date_str = sub.get("next_billing_date", "")[:10]
        if date_str not in by_date:
            by_date[date_str] = []
        by_date[date_str].append(sub)
    
    return {
        "total_upcoming": len(subscriptions),
        "by_date": by_date,
        "subscriptions": subscriptions
    }
