from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class PlanFeature(BaseModel):
    """Individual feature with limits."""
    key: str  # e.g., "target_niches", "growth_speed"
    name: str
    description: Optional[str] = None
    enabled: bool = True
    limit: Optional[int] = None  # None = unlimited
    limit_type: Optional[str] = None  # "count", "percentage", "days"


class FeatureMatrixItem(BaseModel):
    """Feature comparison across plans."""
    feature_key: str
    feature_name: str
    category: str  # "growth", "targeting", "support", "analytics", "advanced"
    description: Optional[str] = None
    basic_value: Optional[str] = None  # "Yes", "No", "5", "Unlimited", etc.
    pro_value: Optional[str] = None
    enterprise_value: Optional[str] = None
    is_boolean: bool = True  # If true, values are Yes/No


class DynamicPlan(BaseModel):
    """Fully dynamic plan - admin can create/modify anytime."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Basic Info
    name: str
    slug: str  # URL-friendly name
    description: str
    short_description: Optional[str] = None
    
    # Pricing
    monthly_price: float
    yearly_price: float
    currency: str = "USD"
    
    # Display
    is_popular: bool = False
    is_active: bool = True
    is_hidden: bool = False  # Hidden plans for enterprise deals
    badge_text: Optional[str] = None  # e.g., "Most Popular", "Best Value"
    badge_color: Optional[str] = None
    
    # Order for display
    display_order: int = 0
    
    # Follower Guarantees
    followers_min: int
    followers_max: int
    
    # Feature Matrix
    features: List[PlanFeature] = Field(default_factory=list)
    feature_list: List[str] = Field(default_factory=list)  # Simple list for display
    
    # Limits
    max_instagram_accounts: int = 1
    max_target_niches: int = 5
    max_competitor_accounts: int = 10
    max_hashtags: int = 20
    max_locations: int = 5
    
    # Growth Settings
    growth_speed: str = "medium"  # slow, medium, fast, ultra
    daily_activity_cap: Optional[int] = None
    
    # Support Level
    support_priority: str = "standard"  # standard, priority, dedicated
    has_dedicated_manager: bool = False
    response_time_hours: int = 24
    
    # Analytics
    analytics_depth: str = "basic"  # basic, advanced, enterprise
    export_enabled: bool = False
    api_access: bool = False
    
    # White Label (for agencies)
    white_label_enabled: bool = False
    
    # Trial
    trial_days: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


class PlanCreate(BaseModel):
    name: str
    slug: str
    description: str
    monthly_price: float
    yearly_price: float
    followers_min: int
    followers_max: int
    feature_list: List[str] = Field(default_factory=list)
    is_popular: bool = False


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    monthly_price: Optional[float] = None
    yearly_price: Optional[float] = None
    followers_min: Optional[int] = None
    followers_max: Optional[int] = None
    feature_list: Optional[List[str]] = None
    is_popular: Optional[bool] = None
    is_active: Optional[bool] = None
    is_hidden: Optional[bool] = None
    badge_text: Optional[str] = None
    display_order: Optional[int] = None
    max_instagram_accounts: Optional[int] = None
    max_target_niches: Optional[int] = None
    max_competitor_accounts: Optional[int] = None
    max_hashtags: Optional[int] = None
    max_locations: Optional[int] = None
    growth_speed: Optional[str] = None
    support_priority: Optional[str] = None
    has_dedicated_manager: Optional[bool] = None
    response_time_hours: Optional[int] = None
    analytics_depth: Optional[str] = None
    export_enabled: Optional[bool] = None
    api_access: Optional[bool] = None
    white_label_enabled: Optional[bool] = None
    trial_days: Optional[int] = None


# Default Feature Matrix
DEFAULT_FEATURE_MATRIX = [
    # Growth Features
    {"feature_key": "guaranteed_followers", "feature_name": "Guaranteed Followers/Month", "category": "growth", "is_boolean": False, "basic_value": "1,000-1,500", "pro_value": "2,500-3,500", "enterprise_value": "5,000+"},
    {"feature_key": "instant_results", "feature_name": "Instant Results From Day 1", "category": "growth", "is_boolean": True, "basic_value": "Yes", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "organic_growth", "feature_name": "Organic Growth Only", "category": "growth", "is_boolean": True, "basic_value": "Yes", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "growth_speed", "feature_name": "Growth Speed", "category": "growth", "is_boolean": False, "basic_value": "Medium", "pro_value": "Fast", "enterprise_value": "Ultra"},
    
    # Targeting Features
    {"feature_key": "ai_targeting", "feature_name": "AI-Powered Targeting", "category": "targeting", "is_boolean": True, "basic_value": "Yes", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "target_niches", "feature_name": "Target Niches", "category": "targeting", "is_boolean": False, "basic_value": "3", "pro_value": "10", "enterprise_value": "Unlimited"},
    {"feature_key": "competitor_targeting", "feature_name": "Competitor Account Targeting", "category": "targeting", "is_boolean": False, "basic_value": "10", "pro_value": "25", "enterprise_value": "Unlimited"},
    {"feature_key": "hashtag_targeting", "feature_name": "Hashtag Targeting", "category": "targeting", "is_boolean": False, "basic_value": "20", "pro_value": "50", "enterprise_value": "Unlimited"},
    {"feature_key": "location_targeting", "feature_name": "Location Targeting", "category": "targeting", "is_boolean": False, "basic_value": "5", "pro_value": "15", "enterprise_value": "Unlimited"},
    
    # Support Features
    {"feature_key": "support_team", "feature_name": "LA & London Team Support", "category": "support", "is_boolean": True, "basic_value": "Yes", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "priority_support", "feature_name": "Priority Support", "category": "support", "is_boolean": True, "basic_value": "No", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "dedicated_manager", "feature_name": "Dedicated Account Manager", "category": "support", "is_boolean": True, "basic_value": "No", "pro_value": "No", "enterprise_value": "Yes"},
    {"feature_key": "response_time", "feature_name": "Response Time", "category": "support", "is_boolean": False, "basic_value": "24h", "pro_value": "4h", "enterprise_value": "1h"},
    
    # Analytics Features
    {"feature_key": "analytics_dashboard", "feature_name": "Real-Time Analytics Dashboard", "category": "analytics", "is_boolean": True, "basic_value": "Yes", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "analytics_depth", "feature_name": "Analytics Depth", "category": "analytics", "is_boolean": False, "basic_value": "Basic", "pro_value": "Advanced", "enterprise_value": "Enterprise"},
    {"feature_key": "export_reports", "feature_name": "Export Reports", "category": "analytics", "is_boolean": True, "basic_value": "No", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "white_label_reports", "feature_name": "White-label Reporting", "category": "analytics", "is_boolean": True, "basic_value": "No", "pro_value": "No", "enterprise_value": "Yes"},
    
    # Advanced Features
    {"feature_key": "ai_engine", "feature_name": "AI-Powered Growth Engine", "category": "advanced", "is_boolean": True, "basic_value": "No", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "adverlyx_cloud", "feature_name": "Adverlyx Cloud™", "category": "advanced", "is_boolean": True, "basic_value": "No", "pro_value": "Yes", "enterprise_value": "Yes"},
    {"feature_key": "api_access", "feature_name": "API Access", "category": "advanced", "is_boolean": True, "basic_value": "No", "pro_value": "No", "enterprise_value": "Yes"},
    {"feature_key": "multiple_accounts", "feature_name": "Instagram Accounts", "category": "advanced", "is_boolean": False, "basic_value": "1", "pro_value": "2", "enterprise_value": "5"},
    {"feature_key": "custom_strategy", "feature_name": "Custom Growth Strategy", "category": "advanced", "is_boolean": True, "basic_value": "No", "pro_value": "No", "enterprise_value": "Yes"},
]


# Default plans to seed
DEFAULT_PLANS = [
    {
        "name": "Basic",
        "slug": "basic",
        "description": "A great way to start growing your account organically. Ideal for personal profiles and small businesses.",
        "short_description": "Perfect for getting started",
        "monthly_price": 49.0,
        "yearly_price": 29.0,
        "is_popular": False,
        "display_order": 1,
        "followers_min": 1000,
        "followers_max": 1500,
        "feature_list": [
            "Guaranteed follower increase",
            "Instant Results From Day 1",
            "Targeted, Organic Followers",
            "LA & London Team Support",
            "Real-Time Analytics Dashboard"
        ],
        "max_instagram_accounts": 1,
        "max_target_niches": 3,
        "growth_speed": "medium",
        "support_priority": "standard",
        "analytics_depth": "basic"
    },
    {
        "name": "Pro",
        "slug": "pro",
        "description": "The best way to grow quickly with advanced targeting. Ideal for fast-growing influencers and brands.",
        "short_description": "Most popular choice",
        "monthly_price": 69.0,
        "yearly_price": 41.0,
        "is_popular": True,
        "badge_text": "Most Popular",
        "display_order": 2,
        "followers_min": 2500,
        "followers_max": 3500,
        "feature_list": [
            "Guaranteed follower increase",
            "Instant Results From Day 1",
            "Targeted, Organic Followers",
            "LA & London Team Support",
            "Real-Time Analytics Dashboard",
            "AI-Powered Growth Engine",
            "Adverlyx Cloud™"
        ],
        "max_instagram_accounts": 2,
        "max_target_niches": 10,
        "growth_speed": "fast",
        "support_priority": "priority",
        "analytics_depth": "advanced",
        "export_enabled": True
    },
    {
        "name": "Enterprise",
        "slug": "enterprise",
        "description": "Custom solutions for agencies and large brands requiring dedicated account management.",
        "short_description": "For serious growth",
        "monthly_price": 149.0,
        "yearly_price": 99.0,
        "is_popular": False,
        "display_order": 3,
        "followers_min": 5000,
        "followers_max": 10000,
        "feature_list": [
            "Everything in Pro",
            "Dedicated Account Manager",
            "Custom Growth Strategy",
            "Priority Support 24/7",
            "White-label Reporting",
            "API Access",
            "Multiple Accounts"
        ],
        "max_instagram_accounts": 5,
        "max_target_niches": -1,  # Unlimited
        "growth_speed": "ultra",
        "support_priority": "dedicated",
        "has_dedicated_manager": True,
        "response_time_hours": 2,
        "analytics_depth": "enterprise",
        "export_enabled": True,
        "api_access": True,
        "white_label_enabled": True
    }
]
