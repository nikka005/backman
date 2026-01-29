from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class PlanType(str, Enum):
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    TRIAL = "trial"
    PAST_DUE = "past_due"


class PlanDetails(BaseModel):
    name: str
    monthly_price: float
    yearly_price: float
    followers_min: int
    followers_max: int
    features: list


# Plan configuration
PLAN_CONFIG = {
    PlanType.BASIC: PlanDetails(
        name="Basic",
        monthly_price=49.0,
        yearly_price=29.0,
        followers_min=1000,
        followers_max=1500,
        features=[
            "Guaranteed follower increase",
            "Instant Results From Day 1",
            "Targeted, Organic Followers",
            "LA & London Team Support",
            "Real-Time Analytics Dashboard"
        ]
    ),
    PlanType.PRO: PlanDetails(
        name="Pro",
        monthly_price=69.0,
        yearly_price=41.0,
        followers_min=2500,
        followers_max=3500,
        features=[
            "Guaranteed follower increase",
            "Instant Results From Day 1",
            "Targeted, Organic Followers",
            "LA & London Team Support",
            "Real-Time Analytics Dashboard",
            "AI-Powered Growth Engine",
            "Adverlyx Cloud™"
        ]
    ),
    PlanType.ENTERPRISE: PlanDetails(
        name="Enterprise",
        monthly_price=149.0,
        yearly_price=99.0,
        followers_min=5000,
        followers_max=10000,
        features=[
            "Everything in Pro",
            "Dedicated Account Manager",
            "Custom Growth Strategy",
            "Priority Support 24/7",
            "White-label Reporting",
            "API Access",
            "Multiple Accounts"
        ]
    )
}


class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan: PlanType
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    
    # Pricing
    price: float
    currency: str = "USD"
    
    # Coupon
    coupon_code: Optional[str] = None
    discount_percent: float = 0.0
    
    # Payment
    payment_method: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    
    # Dates
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Retries
    payment_retry_count: int = 0
    last_payment_attempt: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubscriptionCreate(BaseModel):
    plan: PlanType
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    coupon_code: Optional[str] = None
    payment_method: Optional[str] = None
