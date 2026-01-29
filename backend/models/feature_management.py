"""
Feature Management Models for Adverlyx Digital.
Enterprise-grade feature configuration system.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class FeatureStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DRAFT = "draft"


class FeatureVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    PLAN_RESTRICTED = "plan_restricted"


class PaymentMode(str, Enum):
    TEST = "test"
    LIVE = "live"


class SecurityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ==================== PAGE MANAGEMENT ====================

class PageSEO(BaseModel):
    """SEO settings for a page."""
    title: str = ""
    meta_description: str = ""
    meta_keywords: List[str] = []
    og_image: str = ""
    canonical_url: str = ""


class PageConfig(BaseModel):
    """Configuration for a manageable page."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # e.g., "page_home", "page_pricing"
    name: str  # Display name
    description: str = ""
    
    # Status
    enabled: bool = True
    status: FeatureStatus = FeatureStatus.ACTIVE
    visibility: FeatureVisibility = FeatureVisibility.PUBLIC
    
    # URL & Navigation
    url_slug: str = ""
    show_header: bool = True
    show_footer: bool = True
    show_in_nav: bool = True
    nav_order: int = 0
    
    # SEO
    seo: PageSEO = Field(default_factory=PageSEO)
    
    # Access Control
    allowed_plans: List[str] = []  # Empty = all plans
    requires_auth: bool = False
    
    # Custom content
    custom_css: str = ""
    custom_js: str = ""
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


# ==================== SECTION MANAGEMENT ====================

class SectionContent(BaseModel):
    """Content for a section."""
    headline: str = ""
    subheadline: str = ""
    body_text: str = ""
    cta_text: str = ""
    cta_url: str = ""
    image_url: str = ""
    video_url: str = ""
    items: List[Dict[str, Any]] = []  # For lists, cards, etc.


class SectionStyle(BaseModel):
    """Style options for a section."""
    background_color: str = ""
    background_image: str = ""
    text_color: str = ""
    padding: str = "default"  # compact, default, spacious
    alignment: str = "center"  # left, center, right
    layout: str = "default"  # default, grid, carousel
    animation: str = "none"  # none, fade, slide


class SectionConfig(BaseModel):
    """Configuration for a homepage section."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # e.g., "section_hero", "section_testimonials"
    name: str
    description: str = ""
    
    # Status
    enabled: bool = True
    status: FeatureStatus = FeatureStatus.ACTIVE
    
    # Order & Display
    order: int = 0
    visibility: FeatureVisibility = FeatureVisibility.PUBLIC
    
    # Content
    content: SectionContent = Field(default_factory=SectionContent)
    
    # Style
    style: SectionStyle = Field(default_factory=SectionStyle)
    
    # Access Control
    visible_to_plans: List[str] = []  # Empty = all plans
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


# ==================== PLATFORM FEATURE MANAGEMENT ====================

class FeatureUsageLimits(BaseModel):
    """Usage limits per plan for a feature."""
    plan_id: str
    plan_name: str
    daily_limit: int = -1  # -1 = unlimited
    monthly_limit: int = -1
    rate_limit_per_minute: int = -1


class FeatureDependency(BaseModel):
    """Dependency on another feature."""
    feature_key: str
    required: bool = True
    message: str = ""


class PlatformFeatureConfig(BaseModel):
    """Configuration for a platform feature."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # e.g., "feature_instagram_connect", "feature_analytics"
    name: str
    description: str = ""
    admin_description: str = ""  # Internal notes for admins
    
    # Status
    enabled: bool = True
    status: FeatureStatus = FeatureStatus.ACTIVE
    
    # Access Control
    allowed_plans: List[str] = []  # Empty = all plans
    usage_limits: List[FeatureUsageLimits] = []
    
    # Dependencies
    dependencies: List[FeatureDependency] = []
    
    # Analytics
    track_analytics: bool = True
    analytics_events: List[str] = []
    
    # UI Configuration
    icon: str = ""
    color: str = ""
    show_in_dashboard: bool = True
    dashboard_order: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


# ==================== PAYMENT OPTION MANAGEMENT ====================

class PaymentWebhook(BaseModel):
    """Webhook configuration for payment provider."""
    url: str = ""
    secret: str = ""
    events: List[str] = []
    status: str = "inactive"  # inactive, pending, active, error
    last_event_at: Optional[datetime] = None


class PaymentOptionConfig(BaseModel):
    """Configuration for a payment option."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # e.g., "feature_stripe", "feature_paypal"
    name: str
    description: str = ""
    provider: str = ""  # stripe, razorpay, paypal
    
    # Status
    enabled: bool = True
    status: FeatureStatus = FeatureStatus.ACTIVE
    mode: PaymentMode = PaymentMode.TEST
    
    # Credentials (encrypted in production)
    api_key: str = ""
    api_secret: str = ""
    public_key: str = ""
    merchant_id: str = ""
    
    # Settings
    default_currency: str = "USD"
    supported_currencies: List[str] = ["USD", "EUR", "GBP"]
    min_amount: float = 1.0
    max_amount: float = 10000.0
    
    # Plan Eligibility
    allowed_plans: List[str] = []  # Empty = all plans
    
    # Webhooks
    webhook: PaymentWebhook = Field(default_factory=PaymentWebhook)
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


# ==================== AUTHENTICATION OPTION MANAGEMENT ====================

class AuthProviderCredentials(BaseModel):
    """Credentials for auth provider."""
    client_id: str = ""
    client_secret: str = ""
    redirect_uri: str = ""
    scopes: List[str] = []


class AuthOptionConfig(BaseModel):
    """Configuration for an authentication option."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # e.g., "feature_google_login", "feature_two_factor"
    name: str
    description: str = ""
    provider: str = ""  # google, email, totp
    
    # Status
    enabled: bool = True
    status: FeatureStatus = FeatureStatus.ACTIVE
    
    # Requirements
    required: bool = False  # Force users to use this
    security_level: SecurityLevel = SecurityLevel.MEDIUM
    
    # Credentials
    credentials: AuthProviderCredentials = Field(default_factory=AuthProviderCredentials)
    
    # Restrictions
    allowed_countries: List[str] = []  # Empty = all countries
    allowed_plans: List[str] = []  # Empty = all plans
    
    # Settings
    session_duration_hours: int = 24
    max_attempts: int = 5
    lockout_duration_minutes: int = 30
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None


# ==================== FEATURE MANAGEMENT AUDIT LOG ====================

class FeatureChangeLog(BaseModel):
    """Audit log for feature changes."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    feature_type: str  # page, section, platform, payment, auth
    feature_key: str
    feature_name: str
    action: str  # create, update, delete, enable, disable, publish, draft
    changes: Dict[str, Any] = {}  # {field: {old: x, new: y}}
    admin_id: str
    admin_email: str
    ip_address: str = ""
    user_agent: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==================== DEFAULT CONFIGURATIONS ====================

DEFAULT_PAGES = [
    {"key": "page_home", "name": "Home Page", "url_slug": "/", "nav_order": 1},
    {"key": "page_pricing", "name": "Pricing Page", "url_slug": "/pricing", "nav_order": 2},
    {"key": "page_how_it_works", "name": "How It Works", "url_slug": "/how-it-works", "nav_order": 3},
    {"key": "page_case_studies", "name": "Case Studies", "url_slug": "/case-studies", "nav_order": 4},
    {"key": "page_faq", "name": "FAQ", "url_slug": "/faq", "nav_order": 5},
    {"key": "page_contact", "name": "Contact", "url_slug": "/contact", "nav_order": 6},
    {"key": "page_blog", "name": "Blog", "url_slug": "/blog", "nav_order": 7},
]

DEFAULT_SECTIONS = [
    {"key": "section_hero", "name": "Hero Section", "order": 1},
    {"key": "section_trusted_brands", "name": "Trusted Brands", "order": 2},
    {"key": "section_benefits", "name": "Benefits", "order": 3},
    {"key": "section_how_it_works", "name": "How It Works", "order": 4},
    {"key": "section_stats", "name": "Statistics", "order": 5},
    {"key": "section_testimonials", "name": "Testimonials", "order": 6},
    {"key": "section_pricing", "name": "Pricing", "order": 7},
    {"key": "section_faq", "name": "FAQ", "order": 8},
    {"key": "section_reviews", "name": "Reviews", "order": 9},
]

DEFAULT_PLATFORM_FEATURES = [
    {"key": "feature_instagram_connect", "name": "Instagram Connect", "icon": "📸"},
    {"key": "feature_pause_resume", "name": "Pause/Resume Growth", "icon": "⏸️"},
    {"key": "feature_targeting", "name": "Advanced Targeting", "icon": "🎯"},
    {"key": "feature_analytics", "name": "Analytics Dashboard", "icon": "📊"},
    {"key": "feature_support_tickets", "name": "Support Tickets", "icon": "🎫"},
    {"key": "feature_live_chat", "name": "Live Chat", "icon": "💬"},
]

DEFAULT_PAYMENT_OPTIONS = [
    {"key": "feature_stripe", "name": "Stripe", "provider": "stripe"},
    {"key": "feature_razorpay", "name": "Razorpay", "provider": "razorpay"},
    {"key": "feature_paypal", "name": "PayPal", "provider": "paypal"},
    {"key": "feature_coupons", "name": "Discount Coupons", "provider": "internal"},
]

DEFAULT_AUTH_OPTIONS = [
    {"key": "feature_google_login", "name": "Google Login", "provider": "google"},
    {"key": "feature_email_verification", "name": "Email Verification", "provider": "email"},
    {"key": "feature_two_factor", "name": "Two-Factor Auth", "provider": "totp"},
]
