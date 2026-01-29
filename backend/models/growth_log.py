from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class GrowthLogType(str, Enum):
    FOLLOWER_GAINED = "follower_gained"
    ENGAGEMENT = "engagement"
    PROFILE_VISIT = "profile_visit"
    INTERACTION = "interaction"
    SYSTEM = "system"
    WARNING = "warning"
    ERROR = "error"


class GrowthLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    instagram_account_id: str
    
    # Log type
    log_type: GrowthLogType
    
    # Data
    message: str
    details: Optional[dict] = None
    
    # Stats snapshot
    followers_at_time: Optional[int] = None
    engagement_at_time: Optional[float] = None
    
    # Timestamp
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GrowthLogCreate(BaseModel):
    instagram_account_id: str
    log_type: GrowthLogType
    message: str
    details: Optional[dict] = None
