from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class GrowthIntensity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class AccountStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DISCONNECTED = "disconnected"
    FLAGGED = "flagged"


class InstagramAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Account Info
    username: str
    name: Optional[str] = None
    biography: Optional[str] = None
    profile_url: Optional[str] = None
    profile_picture: Optional[str] = None
    profile_picture_url: Optional[str] = None
    
    # Stats (updated periodically)
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    engagement_rate: float = 0.0
    
    # Growth tracking
    initial_followers: int = 0
    total_followers_gained: int = 0
    followers_this_month: int = 0
    followers_gained_today: int = 0
    followers_gained_this_week: int = 0
    followers_gained_this_month: int = 0
    
    # Settings
    status: AccountStatus = AccountStatus.ACTIVE
    growth_intensity: GrowthIntensity = GrowthIntensity.MEDIUM
    growth_paused: bool = False
    
    # OAuth fields
    oauth_connected: bool = False
    access_token: Optional[str] = None
    token_expires_at: Optional[str] = None
    instagram_id: Optional[str] = None
    
    # Compliance
    risk_disclaimer_accepted: bool = False
    disclaimer_accepted_at: Optional[datetime] = None
    
    # Connection
    connected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_sync: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class InstagramAccountCreate(BaseModel):
    username: str
    risk_disclaimer_accepted: bool = False


class InstagramAccountUpdate(BaseModel):
    growth_intensity: Optional[GrowthIntensity] = None
    growth_paused: Optional[bool] = None
    status: Optional[AccountStatus] = None
