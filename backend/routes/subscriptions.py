from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import uuid

from models.subscription import (
    Subscription, SubscriptionCreate, PlanType, BillingCycle, 
    SubscriptionStatus, PLAN_CONFIG
)
from models.payment import Payment, PaymentCreate, PaymentStatus, PaymentMethod
from utils.auth import get_current_user
from utils.email import send_payment_confirmation_email

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

db = None

def init_router(database):
    global db
    db = database


class PlanResponse(BaseModel):
    id: str
    name: str
    monthly_price: float
    yearly_price: float
    followers_min: int
    followers_max: int
    features: list


class SubscriptionResponse(BaseModel):
    id: str
    plan: PlanType
    billing_cycle: BillingCycle
    status: SubscriptionStatus
    price: float
    currency: str
    start_date: datetime
    next_billing_date: Optional[datetime]
    discount_percent: float
    plan_details: PlanResponse


@router.get("/plans", response_model=List[PlanResponse])
async def get_plans():
    """Get all available subscription plans."""
    plans = []
    for plan_type, details in PLAN_CONFIG.items():
        plans.append(PlanResponse(
            id=plan_type.value,
            name=details.name,
            monthly_price=details.monthly_price,
            yearly_price=details.yearly_price,
            followers_min=details.followers_min,
            followers_max=details.followers_max,
            features=details.features
        ))
    return plans


@router.get("/current", response_model=Optional[SubscriptionResponse])
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """Get current user's subscription."""
    sub_doc = await db.subscriptions.find_one(
        {
            "user_id": current_user['user_id'],
            "status": {"$in": [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL, SubscriptionStatus.PAST_DUE]}
        },
        {"_id": 0}
    )
    
    if not sub_doc:
        return None
    
    plan_details = PLAN_CONFIG[PlanType(sub_doc['plan'])]
    
    return SubscriptionResponse(
        id=sub_doc['id'],
        plan=sub_doc['plan'],
        billing_cycle=sub_doc['billing_cycle'],
        status=sub_doc['status'],
        price=sub_doc['price'],
        currency=sub_doc['currency'],
        start_date=datetime.fromisoformat(sub_doc['start_date']) if isinstance(sub_doc['start_date'], str) else sub_doc['start_date'],
        next_billing_date=datetime.fromisoformat(sub_doc['next_billing_date']) if sub_doc.get('next_billing_date') else None,
        discount_percent=sub_doc.get('discount_percent', 0),
        plan_details=PlanResponse(
            id=sub_doc['plan'],
            name=plan_details.name,
            monthly_price=plan_details.monthly_price,
            yearly_price=plan_details.yearly_price,
            followers_min=plan_details.followers_min,
            followers_max=plan_details.followers_max,
            features=plan_details.features
        )
    )


@router.post("/subscribe", response_model=SubscriptionResponse)
async def create_subscription(sub_data: SubscriptionCreate, current_user: dict = Depends(get_current_user)):
    """Create a new subscription."""
    # Check for existing active subscription
    existing = await db.subscriptions.find_one({
        "user_id": current_user['user_id'],
        "status": {"$in": [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]}
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active subscription. Please upgrade or cancel first."
        )
    
    # Get plan details
    plan_details = PLAN_CONFIG.get(sub_data.plan)
    if not plan_details:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan selected"
        )
    
    # Calculate price
    price = plan_details.yearly_price if sub_data.billing_cycle == BillingCycle.YEARLY else plan_details.monthly_price
    
    # Apply coupon (simplified - in production, validate against coupon database)
    discount = 0.0
    if sub_data.coupon_code:
        # Example: WELCOME50 gives 50% off first month
        if sub_data.coupon_code.upper() == "WELCOME50":
            discount = 50.0
        elif sub_data.coupon_code.upper() == "NEWYEAR":
            discount = 20.0
    
    final_price = price * (1 - discount / 100)
    
    # Calculate next billing date
    now = datetime.now(timezone.utc)
    if sub_data.billing_cycle == BillingCycle.YEARLY:
        next_billing = now + timedelta(days=365)
    else:
        next_billing = now + timedelta(days=30)
    
    # Create subscription
    subscription = Subscription(
        user_id=current_user['user_id'],
        plan=sub_data.plan,
        billing_cycle=sub_data.billing_cycle,
        price=final_price,
        coupon_code=sub_data.coupon_code,
        discount_percent=discount,
        payment_method=sub_data.payment_method,
        next_billing_date=next_billing,
        status=SubscriptionStatus.ACTIVE
    )
    
    # Save subscription
    sub_dict = subscription.model_dump()
    for key in ['start_date', 'end_date', 'next_billing_date', 'cancelled_at', 'last_payment_attempt', 'created_at', 'updated_at']:
        if sub_dict.get(key):
            sub_dict[key] = sub_dict[key].isoformat()
    
    await db.subscriptions.insert_one(sub_dict)
    
    # Update user's current plan
    await db.users.update_one(
        {"id": current_user['user_id']},
        {"$set": {
            "current_plan": sub_data.plan.value,
            "subscription_id": subscription.id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create payment record
    payment = Payment(
        user_id=current_user['user_id'],
        subscription_id=subscription.id,
        amount=final_price,
        status=PaymentStatus.SUCCESS,
        method=PaymentMethod.STRIPE,  # Default to Stripe
        description=f"{plan_details.name} Plan - {sub_data.billing_cycle.value}"
    )
    payment_dict = payment.model_dump()
    for key in ['refunded_at', 'created_at', 'updated_at']:
        if payment_dict.get(key):
            payment_dict[key] = payment_dict[key].isoformat()
    await db.payments.insert_one(payment_dict)
    
    # Send confirmation email
    user_doc = await db.users.find_one({"id": current_user['user_id']})
    await send_subscription_email(
        user_doc['email'],
        user_doc['name'],
        plan_details.name,
        final_price
    )
    
    return SubscriptionResponse(
        id=subscription.id,
        plan=subscription.plan,
        billing_cycle=subscription.billing_cycle,
        status=subscription.status,
        price=subscription.price,
        currency=subscription.currency,
        start_date=subscription.start_date,
        next_billing_date=subscription.next_billing_date,
        discount_percent=subscription.discount_percent,
        plan_details=PlanResponse(
            id=sub_data.plan.value,
            name=plan_details.name,
            monthly_price=plan_details.monthly_price,
            yearly_price=plan_details.yearly_price,
            followers_min=plan_details.followers_min,
            followers_max=plan_details.followers_max,
            features=plan_details.features
        )
    )


@router.post("/cancel")
async def cancel_subscription(current_user: dict = Depends(get_current_user)):
    """Cancel current subscription."""
    sub_doc = await db.subscriptions.find_one({
        "user_id": current_user['user_id'],
        "status": {"$in": [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]}
    })
    
    if not sub_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Cancel subscription (keep active until end of billing period)
    await db.subscriptions.update_one(
        {"id": sub_doc['id']},
        {"$set": {
            "status": SubscriptionStatus.CANCELLED,
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": "Subscription cancelled. You will retain access until the end of your billing period.",
        "access_until": sub_doc.get('next_billing_date')
    }


@router.get("/payments", response_model=List[Payment])
async def get_payment_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Get payment history."""
    payments = await db.payments.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [Payment(**p) for p in payments]
