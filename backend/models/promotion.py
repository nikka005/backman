from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class CampaignStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class CampaignType(str, Enum):
    EMAIL = "email"
    SOCIAL = "social"
    LANDING_PAGE = "landing_page"
    PROMO_BANNER = "promo_banner"
    PUSH_NOTIFICATION = "push_notification"


class ABTestStatus(str, Enum):
    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    WINNER_SELECTED = "winner_selected"


# ==================== ICP (Ideal Customer Profile) ====================

class ICPDemographics(BaseModel):
    """Demographic targeting criteria."""
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    genders: List[str] = Field(default_factory=list)  # ["male", "female", "other"]
    countries: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    income_levels: List[str] = Field(default_factory=list)  # ["low", "medium", "high"]


class ICPBehavior(BaseModel):
    """Behavioral targeting criteria."""
    follower_count_min: Optional[int] = None
    follower_count_max: Optional[int] = None
    engagement_rate_min: Optional[float] = None
    posting_frequency: Optional[str] = None  # "daily", "weekly", "monthly"
    content_types: List[str] = Field(default_factory=list)  # ["photos", "reels", "stories"]
    active_hours: List[int] = Field(default_factory=list)  # [9, 10, 11, 18, 19, 20]


class ICPInterests(BaseModel):
    """Interest-based targeting criteria."""
    niches: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    competitor_followers: List[str] = Field(default_factory=list)  # usernames
    brands_followed: List[str] = Field(default_factory=list)


class ICPPainPoints(BaseModel):
    """Pain points and motivations."""
    pain_points: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    objections: List[str] = Field(default_factory=list)
    motivations: List[str] = Field(default_factory=list)


class IdealCustomerProfile(BaseModel):
    """Complete Ideal Customer Profile for targeting."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    
    # Targeting Criteria
    demographics: ICPDemographics = Field(default_factory=ICPDemographics)
    behavior: ICPBehavior = Field(default_factory=ICPBehavior)
    interests: ICPInterests = Field(default_factory=ICPInterests)
    pain_points: ICPPainPoints = Field(default_factory=ICPPainPoints)
    
    # Scoring
    priority_score: int = 50  # 0-100
    estimated_audience_size: Optional[int] = None
    estimated_conversion_rate: Optional[float] = None
    
    # Status
    is_active: bool = True
    is_primary: bool = False
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None


# ==================== A/B TESTING ====================

class ABTestVariant(BaseModel):
    """Single variant in an A/B test."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # "Control", "Variant A", "Variant B"
    
    # Content
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    body_text: Optional[str] = None
    cta_text: Optional[str] = None
    cta_color: Optional[str] = None
    image_url: Optional[str] = None
    
    # Results
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    revenue: float = 0.0
    
    # Calculated metrics
    click_rate: float = 0.0
    conversion_rate: float = 0.0
    revenue_per_visitor: float = 0.0
    
    # Is winner
    is_winner: bool = False
    is_control: bool = False


class ABTest(BaseModel):
    """A/B test for marketing messages."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    
    # Test Configuration
    test_type: str = "headline"  # headline, cta, image, full_page
    target_page: str = "homepage"  # homepage, pricing, landing
    target_element: Optional[str] = None  # CSS selector or element ID
    
    # Variants
    variants: List[ABTestVariant] = Field(default_factory=list)
    
    # Traffic Split
    traffic_percentage: int = 100  # % of traffic in test
    traffic_split: Dict[str, int] = Field(default_factory=dict)  # {"variant_id": percentage}
    
    # Duration
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_sample_size: int = 100
    
    # Status
    status: ABTestStatus = ABTestStatus.DRAFT
    winning_variant_id: Optional[str] = None
    statistical_significance: Optional[float] = None
    
    # Targeting
    icp_ids: List[str] = Field(default_factory=list)  # Target specific ICPs
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None


# ==================== CAMPAIGNS ====================

class CampaignContent(BaseModel):
    """Content for a campaign."""
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    body: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    
    # Email specific
    email_subject: Optional[str] = None
    email_preview_text: Optional[str] = None
    
    # Social specific
    social_caption: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)


class CampaignSchedule(BaseModel):
    """Scheduling configuration."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    timezone: str = "UTC"
    
    # Recurring
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # "daily", "weekly", "monthly"
    recurrence_days: List[int] = Field(default_factory=list)  # [0,1,2,3,4] for weekdays
    send_time: Optional[str] = None  # "09:00"


class CampaignMetrics(BaseModel):
    """Campaign performance metrics."""
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    revenue: float = 0.0
    spend: float = 0.0
    
    # Rates
    click_rate: float = 0.0
    conversion_rate: float = 0.0
    
    # ROI
    roi: float = 0.0
    cost_per_click: float = 0.0
    cost_per_conversion: float = 0.0
    
    # Email specific
    emails_sent: int = 0
    emails_opened: int = 0
    emails_bounced: int = 0
    unsubscribes: int = 0
    open_rate: float = 0.0


class Campaign(BaseModel):
    """Marketing campaign."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    
    # Type and Status
    campaign_type: CampaignType = CampaignType.PROMO_BANNER
    status: CampaignStatus = CampaignStatus.DRAFT
    
    # Content
    content: CampaignContent = Field(default_factory=CampaignContent)
    
    # Targeting
    icp_ids: List[str] = Field(default_factory=list)
    target_all_users: bool = False
    target_new_users: bool = False
    target_existing_users: bool = False
    target_churned_users: bool = False
    
    # A/B Testing
    ab_test_id: Optional[str] = None
    
    # Schedule
    schedule: CampaignSchedule = Field(default_factory=CampaignSchedule)
    
    # Budget
    budget: Optional[float] = None
    budget_spent: float = 0.0
    
    # Metrics
    metrics: CampaignMetrics = Field(default_factory=CampaignMetrics)
    
    # Tags
    tags: List[str] = Field(default_factory=list)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    launched_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: Optional[str] = None


# ==================== CONTENT ENGINE ====================

class ContentTemplate(BaseModel):
    """Reusable content template."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    
    # Template type
    template_type: str = "email"  # email, social, banner, landing
    
    # Content with placeholders
    subject_template: Optional[str] = None  # "Hey {{first_name}}, grow your account!"
    headline_template: Optional[str] = None
    body_template: Optional[str] = None
    cta_template: Optional[str] = None
    
    # Available variables
    variables: List[str] = Field(default_factory=list)  # ["first_name", "plan_name", "followers_gained"]
    
    # Styling
    theme: Optional[str] = None
    colors: Dict[str, str] = Field(default_factory=dict)
    
    # Status
    is_active: bool = True
    
    # Performance
    times_used: int = 0
    avg_open_rate: float = 0.0
    avg_click_rate: float = 0.0
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Default ICPs
DEFAULT_ICPS = [
    {
        "name": "Growing Influencer",
        "description": "Aspiring influencers with 1K-10K followers looking to grow faster",
        "demographics": {
            "age_min": 18,
            "age_max": 35,
            "genders": ["female", "male"],
            "countries": ["US", "UK", "CA", "AU"]
        },
        "behavior": {
            "follower_count_min": 1000,
            "follower_count_max": 10000,
            "posting_frequency": "daily",
            "content_types": ["photos", "reels"]
        },
        "interests": {
            "niches": ["lifestyle", "fashion", "beauty", "fitness"],
            "hashtags": ["#influencer", "#contentcreator", "#growthjourney"]
        },
        "pain_points": {
            "pain_points": ["Slow follower growth", "Low engagement", "Algorithm changes"],
            "goals": ["Reach 10K followers", "Get brand deals", "Go viral"],
            "motivations": ["Fame", "Income", "Creative expression"]
        },
        "priority_score": 90,
        "is_primary": True
    },
    {
        "name": "Small Business Owner",
        "description": "Local businesses using Instagram for marketing",
        "demographics": {
            "age_min": 25,
            "age_max": 55,
            "countries": ["US", "UK", "CA"]
        },
        "behavior": {
            "follower_count_min": 500,
            "follower_count_max": 5000,
            "posting_frequency": "weekly"
        },
        "interests": {
            "niches": ["business", "entrepreneurship", "local"],
            "hashtags": ["#smallbusiness", "#shoplocal", "#entrepreneur"]
        },
        "pain_points": {
            "pain_points": ["No time for social media", "Low ROI", "Not tech savvy"],
            "goals": ["More customers", "Brand awareness", "Compete with big brands"],
            "motivations": ["Revenue growth", "Customer acquisition"]
        },
        "priority_score": 75,
        "is_primary": False
    },
    {
        "name": "Agency Client",
        "description": "Marketing agencies managing multiple client accounts",
        "demographics": {
            "age_min": 25,
            "age_max": 45,
            "countries": ["US", "UK", "DE", "AU"]
        },
        "behavior": {
            "follower_count_min": 10000,
            "follower_count_max": None
        },
        "interests": {
            "niches": ["marketing", "agency", "digital"],
            "hashtags": ["#digitalmarketing", "#socialmediaagency"]
        },
        "pain_points": {
            "pain_points": ["Client retention", "Scalability", "Reporting"],
            "goals": ["White-label solution", "Bulk management", "Client results"],
            "motivations": ["Client satisfaction", "Agency growth", "Efficiency"]
        },
        "priority_score": 85,
        "is_primary": False
    }
]
