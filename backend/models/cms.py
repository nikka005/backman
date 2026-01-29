from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class CMSContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # unique identifier like "homepage_hero", "faq", "pricing"
    content_type: str  # text, json, html
    
    # Content
    title: Optional[str] = None
    content: dict  # flexible content storage
    
    # Status
    is_active: bool = True
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class CMSContentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[dict] = None
    is_active: Optional[bool] = None


class Testimonial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    handle: str
    avatar: str
    category: str
    followers: str
    growth: str
    member_since: str
    quote: str
    is_featured: bool = False
    is_active: bool = True
    order: int = 0


class FAQ(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    answer: str
    category: str = "general"
    order: int = 0
    is_active: bool = True


class PlatformStats(BaseModel):
    happy_users: str = "55,000+"
    new_fans_monthly: str = "~4,500"
    hours_saved: str = "7M+"
    satisfaction_score: str = "9.8/10"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
