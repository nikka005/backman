from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class AdminAction(str, Enum):
    # User actions
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_SUSPEND = "user_suspend"
    USER_ACTIVATE = "user_activate"
    USER_ROLE_CHANGE = "user_role_change"
    
    # Subscription actions
    SUBSCRIPTION_CREATE = "subscription_create"
    SUBSCRIPTION_UPDATE = "subscription_update"
    SUBSCRIPTION_CANCEL = "subscription_cancel"
    PLAN_CHANGE = "plan_change"
    
    # Payment actions
    REFUND_PROCESS = "refund_process"
    PAYMENT_MANUAL = "payment_manual"
    
    # Instagram actions
    ACCOUNT_PAUSE = "account_pause"
    ACCOUNT_RESUME = "account_resume"
    GROWTH_SPEED_CHANGE = "growth_speed_change"
    
    # System actions
    SETTINGS_UPDATE = "settings_update"
    ANNOUNCEMENT_CREATE = "announcement_create"
    CMS_UPDATE = "cms_update"
    
    # Support actions
    TICKET_ASSIGN = "ticket_assign"
    TICKET_CLOSE = "ticket_close"


class AdminLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    admin_email: str
    
    # Action
    action: AdminAction
    
    # Target
    target_type: str  # user, subscription, payment, etc.
    target_id: Optional[str] = None
    
    # Details
    description: str
    previous_value: Optional[dict] = None
    new_value: Optional[dict] = None
    
    # Meta
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Timestamp
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AdminLogCreate(BaseModel):
    action: AdminAction
    target_type: str
    target_id: Optional[str] = None
    description: str
    previous_value: Optional[dict] = None
    new_value: Optional[dict] = None
