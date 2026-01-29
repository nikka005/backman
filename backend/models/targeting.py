from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class TargetingSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    instagram_account_id: str
    
    # Niche
    niche: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    
    # Location
    locations: List[str] = Field(default_factory=list)
    
    # Demographics
    gender: Optional[str] = None  # male, female, all
    age_range: Optional[dict] = None  # {min: 18, max: 35}
    
    # Competitors
    competitor_accounts: List[str] = Field(default_factory=list)
    
    # Hashtags
    hashtags: List[str] = Field(default_factory=list)
    
    # Interests
    interests: List[str] = Field(default_factory=list)
    
    # AI optimization
    ai_optimization_enabled: bool = True
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TargetingSettingsCreate(BaseModel):
    instagram_account_id: str
    niche: Optional[str] = None
    keywords: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    gender: Optional[str] = None
    competitor_accounts: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)


class TargetingSettingsUpdate(BaseModel):
    niche: Optional[str] = None
    keywords: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    gender: Optional[str] = None
    competitor_accounts: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    ai_optimization_enabled: Optional[bool] = None
