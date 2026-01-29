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
    
    # Validate package exists
    if package_id not in PLAN_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = PLAN_PACKAGES[package_id]
    
    # Get amount from server-side definition only (SECURITY)
    amount = package["amount"]
    currency = package["currency"]
    plan = package["plan"]
    billing = package["billing"]
    
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
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
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
    global stripe_checkout
    
    if not stripe_checkout:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    try:
        # Get status from Stripe
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
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
