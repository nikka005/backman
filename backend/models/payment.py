from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PaymentMethod(str, Enum):
    STRIPE = "stripe"
    RAZORPAY = "razorpay"
    PAYPAL = "paypal"


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    subscription_id: Optional[str] = None
    
    # Amount
    amount: float
    currency: str = "USD"
    
    # Status
    status: PaymentStatus = PaymentStatus.PENDING
    method: PaymentMethod
    
    # External IDs
    stripe_payment_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    paypal_payment_id: Optional[str] = None
    
    # Invoice
    invoice_id: Optional[str] = None
    invoice_url: Optional[str] = None
    
    # Refund
    refund_amount: float = 0.0
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None
    
    # Description
    description: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaymentCreate(BaseModel):
    subscription_id: Optional[str] = None
    amount: float
    currency: str = "USD"
    method: PaymentMethod
    description: Optional[str] = None
