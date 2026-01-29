from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class ButtonStyle(str, Enum):
    ROUNDED = "rounded"
    SQUARE = "square"
    PILL = "pill"


class ThemeMode(str, Enum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class BrandingSettings(BaseModel):
    """Global branding settings - controlled by admin."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Brand Identity
    brand_name: str = "Adverlyx Digital"
    tagline: str = "Smart Growth for Real Brands"
    logo_light: Optional[str] = None  # URL to light mode logo
    logo_dark: Optional[str] = None   # URL to dark mode logo
    favicon: Optional[str] = None     # URL to favicon
    
    # Colors (CSS values)
    primary_color: str = "#ec4899"      # Pink
    secondary_color: str = "#f97316"    # Orange
    accent_color: str = "#8b5cf6"       # Purple
    success_color: str = "#22c55e"      # Green
    warning_color: str = "#f59e0b"      # Amber
    error_color: str = "#ef4444"        # Red
    
    # Gradient (for hero, buttons, etc.)
    gradient_start: str = "#f97316"     # Orange
    gradient_middle: str = "#ec4899"    # Pink
    gradient_end: str = "#8b5cf6"       # Purple
    
    # Typography
    font_family: str = "Inter, system-ui, sans-serif"
    heading_font: str = "Inter, system-ui, sans-serif"
    
    # Timestamps
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class UISettings(BaseModel):
    """UI/UX settings - controlled by admin."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Theme
    default_theme: ThemeMode = ThemeMode.LIGHT
    allow_theme_toggle: bool = True
    
    # Button Styles
    button_style: ButtonStyle = ButtonStyle.PILL
    button_size: str = "default"  # sm, default, lg
    
    # Card & Container Styles
    card_radius: str = "xl"       # none, sm, md, lg, xl, 2xl, full
    container_max_width: str = "7xl"  # 5xl, 6xl, 7xl
    
    # Animations
    animations_enabled: bool = True
    scroll_animations: bool = True
    hover_effects: bool = True
    
    # Spacing
    section_spacing: str = "default"  # compact, default, spacious
    
    # Navbar
    navbar_sticky: bool = True
    navbar_transparent: bool = False
    show_promo_banner: bool = True
    
    # Footer
    show_newsletter: bool = True
    show_social_links: bool = True
    
    # Timestamps
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class FeatureToggle(BaseModel):
    """Feature flags - controlled by admin."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Page Toggles - All enabled by default
    page_home: bool = True
    page_pricing: bool = True
    page_how_it_works: bool = True
    page_case_studies: bool = True
    page_faq: bool = True
    page_contact: bool = True
    page_blog: bool = True
    
    # Section Toggles (Homepage) - All enabled by default
    section_hero: bool = True
    section_trusted_brands: bool = True
    section_testimonials: bool = True
    section_stats: bool = True
    section_secret_sauce: bool = True
    section_benefits: bool = True
    section_how_it_works: bool = True
    section_press: bool = True
    section_pricing: bool = True
    section_faq: bool = True
    section_reviews: bool = True
    
    # Feature Toggles - All enabled by default
    feature_instagram_connect: bool = True
    feature_pause_resume: bool = True
    feature_targeting: bool = True
    feature_analytics: bool = True
    feature_support_tickets: bool = True
    feature_live_chat: bool = True
    
    # Payment Toggles - All enabled by default
    feature_stripe: bool = True
    feature_razorpay: bool = True
    feature_paypal: bool = True
    feature_coupons: bool = True
    
    # Auth Toggles - All enabled by default
    feature_google_login: bool = True
    feature_email_verification: bool = True
    feature_two_factor: bool = True
    
    # Timestamps
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class PageContent(BaseModel):
    """Dynamic page content - controlled by admin CMS."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    page_key: str  # home, pricing, about, etc.
    section_key: str  # hero, features, etc.
    
    # Content
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    content: Optional[Dict[str, Any]] = None  # Flexible JSON content
    
    # Media
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    
    # Status
    is_active: bool = True
    order: int = 0
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class HeroContent(BaseModel):
    """Homepage hero section content."""
    headline_prefix: str = "Get Real Social Media"
    headline_animated_words: List[str] = Field(default_factory=lambda: ["Audiences", "Growth", "Fans", "Presence", "Success"])
    subheadline: str = "Using Organic AI-Growth"
    description: str = "No bots, no spam, no passwords. See real growth automatically using AI, social media experts and our patent-pending* technology."
    cta_text: str = "Start Growing"
    cta_link: str = "/signup"
    
    # Trust badges
    trust_badges: List[str] = Field(default_factory=lambda: ["2-Minute Setup", "100% Growth Guaranteed", "Rated 4.91/5"])
    
    # Background
    show_dashboard_preview: bool = True
    background_style: str = "gradient"  # gradient, image, solid


class StatsContent(BaseModel):
    """Platform statistics displayed on site."""
    happy_users: str = "55,000+"
    new_fans_monthly: str = "~4,500"
    hours_saved: str = "7M+"
    satisfaction_score: str = "9.8/10"
    
    # Additional stats
    countries_served: str = "180+"
    years_experience: str = "5+"
    team_members: str = "50+"


class PromoBanner(BaseModel):
    """Promo banner configuration."""
    enabled: bool = True
    message: str = "🎉 <strong>50% OFF</strong> Annual Plans | Flash Sale Ends Soon!"
    show_countdown: bool = True
    countdown_hours: int = 5
    countdown_minutes: int = 48
    countdown_seconds: int = 32
    background_gradient: str = "from-orange-500 via-pink-500 to-purple-500"
    link: Optional[str] = "/pricing"


class SiteSettings(BaseModel):
    """Main site settings combining all configurations."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Embedded Settings
    branding: BrandingSettings = Field(default_factory=BrandingSettings)
    ui: UISettings = Field(default_factory=UISettings)
    features: FeatureToggle = Field(default_factory=FeatureToggle)
    
    # Content
    hero: HeroContent = Field(default_factory=HeroContent)
    stats: StatsContent = Field(default_factory=StatsContent)
    promo_banner: PromoBanner = Field(default_factory=PromoBanner)
    
    # SEO
    site_title: str = "Adverlyx Digital - Smart Instagram Growth"
    site_description: str = "The #1 Instagram growth service. Get real followers with AI-powered organic growth. Trusted by 55,000+ users."
    site_keywords: str = "instagram growth, social media marketing, followers, engagement"
    
    # Contact
    support_email: str = "support@adverlyx.com"
    sales_email: str = "sales@adverlyx.com"
    phone: Optional[str] = None
    address: str = "Los Angeles, CA & London, UK"
    
    # Social Links
    social_instagram: Optional[str] = "https://instagram.com/adverlyx"
    social_twitter: Optional[str] = "https://twitter.com/adverlyx"
    social_linkedin: Optional[str] = "https://linkedin.com/company/adverlyx"
    social_youtube: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None
