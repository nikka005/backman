from fastapi import APIRouter, HTTPException, Request, Depends
from datetime import datetime, timezone
from typing import Optional
import os
import logging

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)
from utils.auth import get_current_user
from models.user import UserRole
from utils.email import send_payment_confirmation_email
from utils.security import check_rate_limit, get_client_ip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])

db = None
stripe_checkout = None


async def get_stripe_checkout():
    """Get Stripe checkout client, checking database for keys first, then env vars."""
    global db
    
    # Try to get keys from database first (admin panel settings)
    if db is not None:
        try:
            payment_config = await db.feature_payments.find_one({"key": "feature_stripe"})
            if payment_config and payment_config.get("api_key"):
                api_key = payment_config.get("api_key")
                if api_key and not api_key.startswith("YOUR_") and not api_key.startswith("sk_live_YOUR"):
                    logger.info("Using Stripe credentials from database")
                    return StripeCheckout(api_key=api_key, webhook_url="")
        except Exception as e:
            logger.warning(f"Failed to get Stripe keys from database: {e}")
    
    # Fallback to environment variables
    api_key = os.environ.get("STRIPE_API_KEY")
    if api_key and not api_key.startswith("YOUR_") and not api_key.startswith("sk_live_YOUR"):
        return StripeCheckout(api_key=api_key, webhook_url="")
    
    return None


def init_router(database):
    global db, stripe_checkout
    db = database
    
    # Initialize Stripe from env (will also check DB at runtime)
    api_key = os.environ.get("STRIPE_API_KEY")
    if api_key and not api_key.startswith("YOUR_") and not api_key.startswith("sk_live_YOUR"):
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        logger.info("Stripe client initialized from environment")
    else:
        logger.info("Stripe will check database for credentials at runtime")


# Define fixed packages - NEVER accept amounts from frontend
PLAN_PACKAGES = {
    "basic_monthly": {"plan": "basic", "billing": "monthly", "amount": 49.00, "currency": "usd"},
    "basic_yearly": {"plan": "basic", "billing": "yearly", "amount": 29.00 * 12, "currency": "usd"},
    "pro_monthly": {"plan": "pro", "billing": "monthly", "amount": 69.00, "currency": "usd"},
    "pro_yearly": {"plan": "pro", "billing": "yearly", "amount": 41.00 * 12, "currency": "usd"},
    "enterprise_monthly": {"plan": "enterprise", "billing": "monthly", "amount": 149.00, "currency": "usd"},
    "enterprise_yearly": {"plan": "enterprise", "billing": "yearly", "amount": 99.00 * 12, "currency": "usd"},
}


@router.post("/checkout/session")
async def create_checkout_session(
    request: Request,
    package_id: str,
    origin_url: str,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session for subscription."""
    # Rate limiting for payment endpoints
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "payment")
    
    # Get Stripe client (checks DB first, then env)
    checkout_client = await get_stripe_checkout()
    
    if not checkout_client:
        raise HTTPException(status_code=500, detail="Stripe not configured. Please add API keys in Admin Panel > Features > Payment Options")
    
    # Parse package_id format: "planname_monthly" or "planname_yearly"
    # Support any plan from database, not just hardcoded ones
    parts = package_id.rsplit('_', 1)
    if len(parts) != 2 or parts[1] not in ['monthly', 'yearly']:
        raise HTTPException(status_code=400, detail="Invalid package format. Use: planname_monthly or planname_yearly")
    
    plan_name = parts[0].lower()
    billing = parts[1]
    
    # First check hardcoded packages for backwards compatibility
    if package_id in PLAN_PACKAGES:
        package = PLAN_PACKAGES[package_id]
        amount = package["amount"]
        currency = package["currency"]
        plan = package["plan"]
    else:
        # Fetch plan from database - supports any plan added via admin panel
        plan_doc = await db.plans.find_one({
            "$or": [
                {"id": plan_name},
                {"name": {"$regex": f"^{plan_name}$", "$options": "i"}}
            ]
        })
        
        if not plan_doc:
            raise HTTPException(status_code=400, detail=f"Plan '{plan_name}' not found")
        
        # Get the correct price based on billing cycle
        if billing == "yearly":
            # yearly_price is per month, so multiply by 12 for total
            monthly_rate = plan_doc.get("yearly_price") or plan_doc.get("monthly_price", 49)
            amount = monthly_rate * 12
        else:
            amount = plan_doc.get("monthly_price", 49)
        
        currency = "usd"
        plan = plan_doc.get("name", plan_name).lower()
    
    # Build URLs from provided origin (dynamic, not hardcoded)
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/pricing"
    
    # Set webhook URL dynamically
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    checkout_client.webhook_url = webhook_url
    
    # Create checkout session
    try:
        checkout_request = CheckoutSessionRequest(
            amount=float(amount),
            currency=currency,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_id": current_user["user_id"],
                "user_email": current_user.get("email", ""),
                "plan": plan,
                "billing": billing,
                "package_id": package_id
            }
        )
        
        session: CheckoutSessionResponse = await checkout_client.create_checkout_session(checkout_request)
        
        # Create payment transaction record BEFORE redirect
        transaction = {
            "session_id": session.session_id,
            "user_id": current_user["user_id"],
            "user_email": current_user.get("email", ""),
            "amount": amount,
            "currency": currency,
            "plan": plan,
            "billing": billing,
            "package_id": package_id,
            "payment_status": "pending",
            "status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get the status of a checkout session and update subscription if paid."""
    # Get Stripe client
    checkout_client = await get_stripe_checkout()
    
    if not checkout_client:
        raise HTTPException(status_code=500, detail="Stripe not configured")
    
    try:
        # Get status from Stripe
        status: CheckoutStatusResponse = await checkout_client.get_checkout_status(session_id)
        
        # Find the transaction
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Check if already processed (prevent double processing)
        if transaction.get("payment_status") == "paid" and transaction.get("subscription_created"):
            return {
                "status": status.status,
                "payment_status": status.payment_status,
                "amount_total": status.amount_total,
                "currency": status.currency,
                "already_processed": True
            }
        
        # Update transaction status
        update_data = {
            "status": status.status,
            "payment_status": status.payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # If payment successful, create/update subscription
        if status.payment_status == "paid" and not transaction.get("subscription_created"):
            # Create subscription
            subscription = {
                "user_id": transaction["user_id"],
                "plan": transaction["plan"],
                "billing_cycle": transaction["billing"],
                "status": "active",
                "amount": transaction["amount"],
                "currency": transaction["currency"],
                "payment_session_id": session_id,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "next_billing_date": datetime.now(timezone.utc).isoformat(),  # Should calculate properly
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Check if user already has subscription
            existing_sub = await db.subscriptions.find_one({"user_id": transaction["user_id"]})
            if existing_sub:
                # Update existing subscription
                await db.subscriptions.update_one(
                    {"user_id": transaction["user_id"]},
                    {"$set": subscription}
                )
            else:
                # Create new subscription
                await db.subscriptions.insert_one(subscription)
            
            # Update user's plan
            await db.users.update_one(
                {"id": transaction["user_id"]},
                {"$set": {"plan": transaction["plan"], "account_status": "active"}}
            )
            
            update_data["subscription_created"] = True
            update_data["subscription_created_at"] = datetime.now(timezone.utc).isoformat()
            
            # Send payment confirmation email
            user = await db.users.find_one({"id": transaction["user_id"]})
            if user:
                await send_payment_confirmation_email(
                    email=user["email"],
                    name=user.get("name", "Customer"),
                    plan=transaction["plan"],
                    amount=transaction["amount"],
                    billing=transaction["billing"]
                )
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "plan": transaction.get("plan"),
            "billing": transaction.get("billing")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get checkout status: {str(e)}")


@router.get("/history")
async def get_payment_history(current_user: dict = Depends(get_current_user)):
    """Get user's payment history."""
    payments = await db.payment_transactions.find(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return payments


@router.get("/subscription")
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """Get user's current subscription."""
    subscription = await db.subscriptions.find_one(
        {"user_id": current_user["user_id"]},
        {"_id": 0}
    )
    
    if not subscription:
        return {"has_subscription": False}
    
    return {"has_subscription": True, "subscription": subscription}


@router.post("/subscription/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel user's subscription."""
    result = await db.subscriptions.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Update user plan to free
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"plan": "free"}}
    )
    
    return {"message": "Subscription cancelled successfully"}


# Webhook endpoint for Stripe
@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    global stripe_checkout
    
    if not stripe_checkout:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook
        if webhook_response.session_id:
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "webhook_event_type": webhook_response.event_type,
                    "webhook_event_id": webhook_response.event_id,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        return {"status": "received"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")


# Admin endpoints
@router.get("/admin/transactions")
async def get_all_transactions(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 50
):
    """Get all transactions (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    transactions = await db.payment_transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.payment_transactions.count_documents({})
    
    return {"transactions": transactions, "total": total}


@router.post("/admin/refund/{session_id}")
async def process_refund(
    session_id: str,
    reason: str = "requested_by_customer",
    current_user: dict = Depends(get_current_user)
):
    """Process a refund (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update transaction
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "refund_status": "refunded",
            "refund_reason": reason,
            "refunded_at": datetime.now(timezone.utc).isoformat(),
            "refunded_by": current_user["user_id"]
        }}
    )
    
    # Cancel subscription if exists
    await db.subscriptions.update_one(
        {"payment_session_id": session_id},
        {"$set": {"status": "refunded"}}
    )
    
    return {"message": "Refund processed", "session_id": session_id}



# ============== Coupon Management ==============

from pydantic import BaseModel

class CouponValidateRequest(BaseModel):
    code: str
    plan_slug: Optional[str] = None


@router.post("/coupon/validate")
async def validate_coupon(
    request: CouponValidateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Validate a coupon code."""
    code = request.code.upper().strip()
    
    # Check database for coupon
    coupon = await db.coupons.find_one({
        "code": code,
        "is_active": True
    }, {"_id": 0})
    
    if coupon:
        # Check expiry
        if coupon.get("expires_at"):
            expiry = datetime.fromisoformat(coupon["expires_at"].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) > expiry:
                return {"valid": False, "message": "Coupon has expired"}
        
        # Check usage limit
        if coupon.get("max_uses") and coupon.get("current_uses", 0) >= coupon["max_uses"]:
            return {"valid": False, "message": "Coupon usage limit reached"}
        
        # Check plan restriction
        if coupon.get("valid_plans") and request.plan_slug:
            if request.plan_slug.lower() not in [p.lower() for p in coupon["valid_plans"]]:
                return {"valid": False, "message": "Coupon not valid for this plan"}
        
        return {
            "valid": True,
            "code": coupon["code"],
            "discount_percent": coupon.get("discount_percent", 0),
            "discount_amount": coupon.get("discount_amount", 0),
            "message": coupon.get("description", "Coupon applied successfully")
        }
    
    # Fallback to hardcoded test coupons for demo
    test_coupons = {
        "WELCOME20": {"discount_percent": 20, "description": "20% Welcome Discount"},
        "ADVERLYX10": {"discount_percent": 10, "description": "10% Special Discount"},
        "FIRST50": {"discount_percent": 50, "description": "50% First Time Discount"},
        "GROWTH25": {"discount_percent": 25, "description": "25% Growth Special"}
    }
    
    if code in test_coupons:
        return {
            "valid": True,
            "code": code,
            "discount_percent": test_coupons[code]["discount_percent"],
            "discount_amount": 0,
            "message": test_coupons[code]["description"]
        }
    
    return {"valid": False, "message": "Invalid or expired coupon code"}


# Admin coupon management
@router.get("/admin/coupons")
async def get_all_coupons(current_user: dict = Depends(get_current_user)):
    """Get all coupons (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    coupons = await db.coupons.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return coupons


class CouponCreate(BaseModel):
    code: str
    description: str = ""
    discount_percent: int = 0
    discount_amount: float = 0
    max_uses: Optional[int] = None
    valid_plans: Optional[list] = None
    expires_at: Optional[str] = None


@router.post("/admin/coupons")
async def create_coupon(
    coupon_data: CouponCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new coupon (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    import uuid
    coupon = {
        "id": str(uuid.uuid4()),
        "code": coupon_data.code.upper().strip(),
        "description": coupon_data.description,
        "discount_percent": coupon_data.discount_percent,
        "discount_amount": coupon_data.discount_amount,
        "max_uses": coupon_data.max_uses,
        "current_uses": 0,
        "valid_plans": coupon_data.valid_plans,
        "expires_at": coupon_data.expires_at,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    
    # Check for duplicate code
    existing = await db.coupons.find_one({"code": coupon["code"]})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    await db.coupons.insert_one(coupon)
    return {"message": "Coupon created", "coupon": coupon}


@router.put("/admin/coupons/{coupon_id}")
async def update_coupon(
    coupon_id: str,
    coupon_data: CouponCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update a coupon (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {
        "code": coupon_data.code.upper().strip(),
        "description": coupon_data.description,
        "discount_percent": coupon_data.discount_percent,
        "discount_amount": coupon_data.discount_amount,
        "max_uses": coupon_data.max_uses,
        "valid_plans": coupon_data.valid_plans,
        "expires_at": coupon_data.expires_at,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.coupons.update_one({"id": coupon_id}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon updated"}


@router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a coupon (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return {"message": "Coupon deleted"}
