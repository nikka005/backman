from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class AnalyticsPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    ALL_TIME = "all_time"


class UserAnalytics(BaseModel):
    """Per-user analytics for admin insights."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Growth Metrics
    growth_velocity: float = 0.0  # Followers gained per day avg
    growth_trend: str = "stable"  # increasing, stable, decreasing
    total_followers_gained: int = 0
    
    # Engagement
    engagement_rate: float = 0.0
    engagement_trend: str = "stable"
    
    # Health Scores (0-100)
    activity_health_score: float = 0.0
    account_risk_score: float = 0.0
    retention_probability: float = 0.0
    
    # Behavior
    login_frequency: float = 0.0  # Logins per week
    feature_usage: Dict[str, int] = Field(default_factory=dict)
    
    # Lifetime Value
    ltv: float = 0.0
    total_spent: float = 0.0
    
    # Flags
    is_at_risk: bool = False
    is_power_user: bool = False
    needs_attention: bool = False
    
    # Timestamps
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PlatformAnalytics(BaseModel):
    """Platform-wide analytics for founder dashboard."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    period: AnalyticsPeriod
    date: datetime
    
    # Revenue Metrics
    mrr: float = 0.0
    arr: float = 0.0
    total_revenue: float = 0.0
    revenue_growth_rate: float = 0.0
    
    # User Metrics
    total_users: int = 0
    active_users: int = 0
    new_users: int = 0
    churned_users: int = 0
    
    # Subscription Metrics
    total_subscriptions: int = 0
    active_subscriptions: int = 0
    new_subscriptions: int = 0
    cancelled_subscriptions: int = 0
    
    # Churn & Retention
    churn_rate: float = 0.0
    retention_rate: float = 0.0
    
    # Average Revenue
    arpu: float = 0.0  # Average Revenue Per User
    arppu: float = 0.0  # Average Revenue Per Paying User
    
    # Plan Distribution
    plan_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Geographic Distribution
    country_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Conversion
    signup_to_paid_rate: float = 0.0
    trial_conversion_rate: float = 0.0
    
    # Timestamps
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class GrowthEngineAnalytics(BaseModel):
    """Analytics for the growth engine performance."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    period: AnalyticsPeriod
    date: datetime
    
    # Performance Metrics
    total_accounts_served: int = 0
    average_followers_gained: float = 0.0
    average_engagement_increase: float = 0.0
    
    # Success Rates
    success_rate: float = 0.0
    guarantee_met_rate: float = 0.0
    
    # Time Metrics
    average_time_to_first_result: float = 0.0  # Hours
    average_time_to_guarantee: float = 0.0  # Days
    
    # Niche Performance
    niche_performance: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    # e.g., {"fashion": {"avg_growth": 150, "success_rate": 95}}
    
    # Targeting Performance
    best_performing_locations: List[str] = Field(default_factory=list)
    best_performing_hashtags: List[str] = Field(default_factory=list)
    
    # Failure Analysis
    failure_reasons: Dict[str, int] = Field(default_factory=dict)
    
    # Timestamps
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FunnelEvent(BaseModel):
    """Funnel and behavior tracking event."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Event Info
    event_type: str  # page_view, click, scroll, form_submit, etc.
    event_name: str
    
    # User Info (optional - anonymous tracking)
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Page Info
    page: str
    page_section: Optional[str] = None
    
    # Event Data
    data: Dict[str, Any] = Field(default_factory=dict)
    
    # Context
    referrer: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    
    # Device Info
    device_type: Optional[str] = None  # desktop, mobile, tablet
    browser: Optional[str] = None
    country: Optional[str] = None
    
    # Timestamp
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FunnelAnalytics(BaseModel):
    """Aggregated funnel analytics."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    period: AnalyticsPeriod
    date: datetime
    
    # Page Views
    homepage_views: int = 0
    pricing_views: int = 0
    signup_page_views: int = 0
    login_page_views: int = 0
    
    # Conversion Funnel
    homepage_to_pricing: float = 0.0
    pricing_to_signup: float = 0.0
    signup_to_complete: float = 0.0
    signup_abandonment_rate: float = 0.0
    
    # CTA Performance
    cta_clicks: Dict[str, int] = Field(default_factory=dict)
    cta_conversion_rates: Dict[str, float] = Field(default_factory=dict)
    
    # Scroll Depth
    avg_scroll_depth: float = 0.0
    scroll_to_pricing: float = 0.0
    scroll_to_testimonials: float = 0.0
    
    # Engagement
    avg_time_on_page: float = 0.0
    bounce_rate: float = 0.0
    
    # Traffic Sources
    traffic_sources: Dict[str, int] = Field(default_factory=dict)
    
    # Device Distribution
    device_distribution: Dict[str, int] = Field(default_factory=dict)
    
    # Timestamps
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
