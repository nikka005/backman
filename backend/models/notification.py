from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    ANNOUNCEMENT = "announcement"


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # "all" for broadcast
    
    # Content
    title: str
    message: str
    notification_type: NotificationType = NotificationType.INFO
    
    # Link
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    
    # Status
    read: bool = False
    read_at: Optional[datetime] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None


class NotificationCreate(BaseModel):
    user_id: str = "all"  # "all" for broadcast
    title: str
    message: str
    notification_type: NotificationType = NotificationType.INFO
    action_url: Optional[str] = None
    action_text: Optional[str] = None
