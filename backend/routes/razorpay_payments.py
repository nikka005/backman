"""
Razorpay payment integration for Adverlyx Digital.
Handles INR payments for Indian customers.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import razorpay
import os
import logging
import hmac
import hashlib

from utils.auth import get_current_user
from utils.security import check_rate_limit, get_client_ip

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments/razorpay", tags=["Razorpay Payments"])

db = None
razorpay_client = None


async def get_razorpay_client():
    """Get Razorpay client, checking database for keys first, then env vars."""
    global razorpay_client
    
    # Try to get keys from database first (admin panel settings)
    if db is not None:
        try:
            # Check feature_payments collection (where admin panel saves payment configs)
            payment_config = await db.feature_payments.find_one({"key": "feature_razorpay"})
            if payment_config and payment_config.get("api_key") and payment_config.get("api_secret"):
                key_id = payment_config.get("api_key")
                key_secret = payment_config.get("api_secret")
                if key_id and key_secret and not key_id.startswith("YOUR_") and not key_secret.startswith("YOUR_"):
                    logger.info("Using Razorpay credentials from database")
                    return razorpay.Client(auth=(key_id, key_secret))
        except Exception as e:
            logger.warning(f"Failed to get Razorpay keys from database: {e}")
    
    # Fallback to environment variables
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    if key_id and key_secret and not key_id.startswith("YOUR_") and not key_secret.startswith("YOUR_"):
        return razorpay.Client(auth=(key_id, key_secret))
    
    return None


def init_router(database):
    global db, razorpay_client
    db = database
    
    # Initialize Razorpay client from env (will also check DB at runtime)
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    if key_id and key_secret and not key_id.startswith("YOUR_") and not key_secret.startswith("YOUR_"):
        razorpay_client = razorpay.Client(auth=(key_id, key_secret))
        logger.info("Razorpay client initialized from environment")
    else:
        logger.info("Razorpay will check database for credentials at runtime")


# Plan packages in INR (Indian Rupees) - amounts in paise (multiply by 100)
PLAN_PACKAGES_INR = {
    "basic_monthly": {"plan": "basic", "billing": "monthly", "amount": 4067, "display_amount": 4067},  # ~₹4,067
    "basic_yearly": {"plan": "basic", "billing": "yearly", "amount": 28884, "display_amount": 28884},  # ~₹28,884
    "pro_monthly": {"plan": "pro", "billing": "monthly", "amount": 5727, "display_amount": 5727},  # ~₹5,727
    "pro_yearly": {"plan": "pro", "billing": "yearly", "amount": 40836, "display_amount": 40836},  # ~₹40,836
    "enterprise_monthly": {"plan": "enterprise", "billing": "monthly", "amount": 12367, "display_amount": 12367},  # ~₹12,367
    "enterprise_yearly": {"plan": "enterprise", "billing": "yearly", "amount": 98604, "display_amount": 98604},  # ~₹98,604
}


class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str
    user_email: str
    user_name: str


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order", response_model=RazorpayOrderResponse)
async def create_razorpay_order(
    request: Request,
    package_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Create a Razorpay order for subscription payment."""
    # Rate limiting
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "payment")
    
    # Get Razorpay client (checks DB first, then env)
    client = await get_razorpay_client()
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay not configured. Please add API keys in Admin Panel > Features > Payment Options")
    
    # Validate package
    if package_id not in PLAN_PACKAGES_INR:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package = PLAN_PACKAGES_INR[package_id]
    amount_paise = package["amount"] * 100  # Convert to paise
    
    # Get key_id for frontend
    key_id = None
    if db is not None:
        try:
            payment_config = await db.payment_options.find_one({"provider": "razorpay"})
            if payment_config:
                key_id = payment_config.get("api_key") or payment_config.get("public_key")
        except:
            pass
    if not key_id:
        key_id = os.environ.get("RAZORPAY_KEY_ID", "")
    
    try:
        # Create Razorpay order
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"order_{current_user['user_id']}_{package_id}",
            "notes": {
                "user_id": current_user["user_id"],
                "package_id": package_id,
                "plan": package["plan"],
                "billing": package["billing"]
            }
        }
        
        order = client.order.create(data=order_data)
        
        # Store order in database
        order_record = {
            "id": order["id"],
            "user_id": current_user["user_id"],
            "package_id": package_id,
            "plan": package["plan"],
            "billing": package["billing"],
            "amount": package["amount"],
            "amount_paise": amount_paise,
            "currency": "INR",
            "status": "created",
            "provider": "razorpay",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_orders.insert_one(order_record)
        
        # Get user details for prefill
        user = await db.users.find_one({"id": current_user["user_id"]})
        
        return RazorpayOrderResponse(
            order_id=order["id"],
            amount=amount_paise,
            currency="INR",
            key_id=key_id or "",
            user_email=user.get("email", "") if user else "",
            user_name=user.get("name", "") if user else ""
        )
        
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify-payment")
async def verify_razorpay_payment(
    request: Request,
    verify_data: RazorpayVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature and activate subscription."""
    # Get client to ensure keys are available
    client = await get_razorpay_client()
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay not configured")
    
    try:
        # Get key_secret from database or env
        key_secret = None
        if db is not None:
            try:
                payment_config = await db.payment_options.find_one({"provider": "razorpay"})
                if payment_config:
                    key_secret = payment_config.get("api_secret")
            except:
                pass
        if not key_secret:
            key_secret = os.environ.get("RAZORPAY_KEY_SECRET", "")
        
        # Create signature verification string
        message = f"{verify_data.razorpay_order_id}|{verify_data.razorpay_payment_id}"
        generated_signature = hmac.new(
            key_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if generated_signature != verify_data.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid payment signature")
        
        # Get order details
        order = await db.payment_orders.find_one({"id": verify_data.razorpay_order_id})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Verify order belongs to user
        if order["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Update order status
        await db.payment_orders.update_one(
            {"id": verify_data.razorpay_order_id},
            {"$set": {
                "status": "paid",
                "razorpay_payment_id": verify_data.razorpay_payment_id,
                "razorpay_signature": verify_data.razorpay_signature,
                "paid_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Create/Update subscription
        subscription_record = {
            "id": f"sub_rz_{verify_data.razorpay_payment_id}",
            "user_id": current_user["user_id"],
            "plan": order["plan"],
            "billing_cycle": order["billing"],
            "status": "active",
            "amount": order["amount"],
            "currency": "INR",
            "provider": "razorpay",
            "razorpay_order_id": verify_data.razorpay_order_id,
            "razorpay_payment_id": verify_data.razorpay_payment_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.subscriptions.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": subscription_record},
            upsert=True
        )
        
        # Record payment
        payment_record = {
            "id": f"pay_rz_{verify_data.razorpay_payment_id}",
            "user_id": current_user["user_id"],
            "razorpay_order_id": verify_data.razorpay_order_id,
            "razorpay_payment_id": verify_data.razorpay_payment_id,
            "amount": order["amount"],
            "currency": "INR",
            "status": "success",
            "provider": "razorpay",
            "plan": order["plan"],
            "billing": order["billing"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(payment_record)
        
        # Update user plan
        await db.users.update_one(
            {"id": current_user["user_id"]},
            {"$set": {
                "current_plan": order["plan"],
                "subscription_status": "active",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Send confirmation email
        try:
            from utils.email import send_payment_confirmation_email
            user = await db.users.find_one({"id": current_user["user_id"]})
            if user:
                await send_payment_confirmation_email(
                    user["email"],
                    user.get("name", "Customer"),
                    order["plan"],
                    order["amount"],
                    order["billing"]
                )
        except Exception as e:
            logger.error(f"Failed to send confirmation email: {e}")
        
        return {
            "success": True,
            "message": "Payment verified and subscription activated",
            "subscription_id": subscription_record["id"],
            "plan": order["plan"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verification failed: {e}")
        raise HTTPException(status_code=500, detail="Payment verification failed")


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Handle Razorpay webhook events."""
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")
    
    if webhook_secret:
        try:
            razorpay_client.utility.verify_webhook_signature(
                payload.decode(),
                signature,
                webhook_secret
            )
        except Exception as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    import json
    event = json.loads(payload)
    event_type = event.get("event")
    
    logger.info(f"Razorpay webhook received: {event_type}")
    
    if event_type == "payment.captured":
        payment = event.get("payload", {}).get("payment", {}).get("entity", {})
        await handle_payment_captured(payment)
    
    elif event_type == "payment.failed":
        payment = event.get("payload", {}).get("payment", {}).get("entity", {})
        await handle_payment_failed(payment)
    
    elif event_type == "refund.created":
        refund = event.get("payload", {}).get("refund", {}).get("entity", {})
        await handle_refund_created(refund)
    
    return {"status": "received"}


async def handle_payment_captured(payment: dict):
    """Handle successful payment capture."""
    payment_id = payment.get("id")
    order_id = payment.get("order_id")
    
    # Update order status
    await db.payment_orders.update_one(
        {"id": order_id},
        {"$set": {"status": "captured", "captured_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    logger.info(f"Payment captured: {payment_id}")


async def handle_payment_failed(payment: dict):
    """Handle failed payment."""
    payment_id = payment.get("id")
    order_id = payment.get("order_id")
    error = payment.get("error_description", "Payment failed")
    
    # Update order status
    await db.payment_orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "failed",
            "error": error,
            "failed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify user
    order = await db.payment_orders.find_one({"id": order_id})
    if order:
        await db.notifications.insert_one({
            "user_id": order["user_id"],
            "type": "payment_failed",
            "title": "Payment Failed",
            "message": f"Your payment could not be processed: {error}",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    logger.warning(f"Payment failed: {payment_id} - {error}")


async def handle_refund_created(refund: dict):
    """Handle refund creation."""
    refund_id = refund.get("id")
    payment_id = refund.get("payment_id")
    amount = refund.get("amount", 0) / 100  # Convert from paise
    
    # Record refund
    await db.payments.insert_one({
        "id": f"refund_rz_{refund_id}",
        "razorpay_payment_id": payment_id,
        "razorpay_refund_id": refund_id,
        "amount": amount,
        "currency": "INR",
        "status": "refunded",
        "provider": "razorpay",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Refund created: {refund_id} - ₹{amount}")


@router.get("/packages")
async def get_razorpay_packages():
    """Get available packages with INR pricing."""
    packages = []
    for key, pkg in PLAN_PACKAGES_INR.items():
        packages.append({
            "id": key,
            "plan": pkg["plan"],
            "billing": pkg["billing"],
            "amount": pkg["amount"],
            "display_amount": f"₹{pkg['display_amount']:,}",
            "currency": "INR"
        })
    return packages
