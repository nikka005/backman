"""
Stripe Webhook handlers for Adverlyx Digital.
Handles payment events from Stripe.
"""
from fastapi import APIRouter, Request, HTTPException, Header
from datetime import datetime, timezone
import stripe
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

db = None
stripe.api_key = os.environ.get("STRIPE_API_KEY", "")
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


def init_router(database):
    global db
    db = database


@router.post("/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    """Handle Stripe webhook events."""
    payload = await request.body()
    
    # Verify webhook signature if secret is configured
    if WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Parse without verification (dev mode)
        import json
        event = json.loads(payload)
    
    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})
    
    logger.info(f"Received Stripe webhook: {event_type}")
    
    try:
        # Handle different event types
        if event_type == "checkout.session.completed":
            await handle_checkout_completed(data)
        
        elif event_type == "customer.subscription.created":
            await handle_subscription_created(data)
        
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(data)
        
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(data)
        
        elif event_type == "invoice.paid":
            await handle_invoice_paid(data)
        
        elif event_type == "invoice.payment_failed":
            await handle_payment_failed(data)
        
        elif event_type == "customer.created":
            await handle_customer_created(data)
        
        elif event_type == "charge.refunded":
            await handle_charge_refunded(data)
        
        else:
            logger.info(f"Unhandled event type: {event_type}")
    
    except Exception as e:
        logger.error(f"Error handling webhook {event_type}: {e}")
        # Don't raise - return 200 to prevent Stripe retries for non-critical errors
    
    return {"status": "received"}


async def handle_checkout_completed(data: dict):
    """Handle successful checkout session completion."""
    session_id = data.get("id")
    customer_id = data.get("customer")
    customer_email = data.get("customer_email")
    subscription_id = data.get("subscription")
    amount_total = data.get("amount_total", 0) / 100  # Convert from cents
    metadata = data.get("metadata", {})
    
    logger.info(f"Checkout completed: {session_id} for {customer_email}")
    
    # Find user by email or customer ID
    user = await db.users.find_one({
        "$or": [
            {"email": customer_email},
            {"stripe_customer_id": customer_id}
        ]
    })
    
    if user:
        # Update user with Stripe customer ID
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "stripe_customer_id": customer_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Record payment
        payment_record = {
            "id": f"pay_{session_id}",
            "user_id": user["id"],
            "stripe_session_id": session_id,
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id,
            "amount": amount_total,
            "currency": data.get("currency", "usd"),
            "status": "success",
            "payment_method": "card",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(payment_record)


async def handle_subscription_created(data: dict):
    """Handle new subscription creation."""
    subscription_id = data.get("id")
    customer_id = data.get("customer")
    status = data.get("status")
    plan = data.get("items", {}).get("data", [{}])[0]
    price_id = plan.get("price", {}).get("id")
    amount = plan.get("price", {}).get("unit_amount", 0) / 100
    interval = plan.get("price", {}).get("recurring", {}).get("interval", "month")
    
    logger.info(f"Subscription created: {subscription_id}")
    
    # Find user by customer ID
    user = await db.users.find_one({"stripe_customer_id": customer_id})
    
    if user:
        # Determine plan type from price
        plan_type = "basic"
        if amount > 100:
            plan_type = "enterprise"
        elif amount > 50:
            plan_type = "pro"
        
        # Create or update subscription record
        subscription_record = {
            "id": subscription_id,
            "user_id": user["id"],
            "stripe_subscription_id": subscription_id,
            "stripe_customer_id": customer_id,
            "stripe_price_id": price_id,
            "plan": plan_type,
            "status": "active" if status == "active" else "pending",
            "billing_cycle": "yearly" if interval == "year" else "monthly",
            "amount": amount * (12 if interval == "year" else 1),
            "current_period_start": data.get("current_period_start"),
            "current_period_end": data.get("current_period_end"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.subscriptions.update_one(
            {"stripe_subscription_id": subscription_id},
            {"$set": subscription_record},
            upsert=True
        )
        
        # Update user's current plan
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "current_plan": plan_type,
                "subscription_status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )


async def handle_subscription_updated(data: dict):
    """Handle subscription updates (upgrades, downgrades, status changes)."""
    subscription_id = data.get("id")
    status = data.get("status")
    cancel_at_period_end = data.get("cancel_at_period_end", False)
    
    logger.info(f"Subscription updated: {subscription_id} - status: {status}")
    
    update_data = {
        "status": "cancelled" if status == "canceled" else status,
        "cancel_at_period_end": cancel_at_period_end,
        "current_period_end": data.get("current_period_end"),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status == "canceled":
        update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.subscriptions.update_one(
        {"stripe_subscription_id": subscription_id},
        {"$set": update_data}
    )
    
    # Update user status
    sub = await db.subscriptions.find_one({"stripe_subscription_id": subscription_id})
    if sub:
        user_update = {"subscription_status": status}
        if status == "canceled":
            user_update["current_plan"] = None
        
        await db.users.update_one(
            {"id": sub["user_id"]},
            {"$set": user_update}
        )


async def handle_subscription_deleted(data: dict):
    """Handle subscription cancellation/deletion."""
    subscription_id = data.get("id")
    
    logger.info(f"Subscription deleted: {subscription_id}")
    
    await db.subscriptions.update_one(
        {"stripe_subscription_id": subscription_id},
        {"$set": {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update user
    sub = await db.subscriptions.find_one({"stripe_subscription_id": subscription_id})
    if sub:
        await db.users.update_one(
            {"id": sub["user_id"]},
            {"$set": {
                "current_plan": None,
                "subscription_status": "cancelled"
            }}
        )


async def handle_invoice_paid(data: dict):
    """Handle successful invoice payment."""
    invoice_id = data.get("id")
    customer_id = data.get("customer")
    subscription_id = data.get("subscription")
    amount_paid = data.get("amount_paid", 0) / 100
    
    logger.info(f"Invoice paid: {invoice_id} - ${amount_paid}")
    
    # Find user
    user = await db.users.find_one({"stripe_customer_id": customer_id})
    
    if user:
        # Record payment
        payment_record = {
            "id": f"inv_{invoice_id}",
            "user_id": user["id"],
            "stripe_invoice_id": invoice_id,
            "stripe_subscription_id": subscription_id,
            "amount": amount_paid,
            "currency": data.get("currency", "usd"),
            "status": "success",
            "payment_method": "card",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(payment_record)


async def handle_payment_failed(data: dict):
    """Handle failed payment."""
    invoice_id = data.get("id")
    customer_id = data.get("customer")
    
    logger.warning(f"Payment failed for invoice: {invoice_id}")
    
    # Find user and notify
    user = await db.users.find_one({"stripe_customer_id": customer_id})
    
    if user:
        # Create notification
        notification = {
            "user_id": user["id"],
            "type": "payment_failed",
            "title": "Payment Failed",
            "message": "Your recent payment could not be processed. Please update your payment method.",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        
        # Record failed payment
        payment_record = {
            "id": f"failed_{invoice_id}",
            "user_id": user["id"],
            "stripe_invoice_id": invoice_id,
            "amount": data.get("amount_due", 0) / 100,
            "status": "failed",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(payment_record)


async def handle_customer_created(data: dict):
    """Handle new Stripe customer creation."""
    customer_id = data.get("id")
    email = data.get("email")
    
    logger.info(f"Customer created: {customer_id} - {email}")
    
    # Update user if exists
    if email:
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "stripe_customer_id": customer_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )


async def handle_charge_refunded(data: dict):
    """Handle refund event."""
    charge_id = data.get("id")
    amount_refunded = data.get("amount_refunded", 0) / 100
    customer_id = data.get("customer")
    
    logger.info(f"Charge refunded: {charge_id} - ${amount_refunded}")
    
    # Find user and create refund record
    user = await db.users.find_one({"stripe_customer_id": customer_id})
    
    if user:
        refund_record = {
            "id": f"refund_{charge_id}",
            "user_id": user["id"],
            "stripe_charge_id": charge_id,
            "amount": amount_refunded,
            "status": "refunded",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payments.insert_one(refund_record)
