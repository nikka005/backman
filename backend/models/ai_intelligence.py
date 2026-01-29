"""
Adverlyx Intelligence AI Models
Enterprise-grade AI system for admin decision support
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid


class AIModuleType(str, Enum):
    """Types of AI modules available."""
    GROWTH_PLANNING = "growth_planning"
    ANALYTICS_INTELLIGENCE = "analytics_intelligence"
    DECISION_SUPPORT = "decision_support"
    RISK_ASSESSMENT = "risk_assessment"


class AIProvider(str, Enum):
    """LLM providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"


class AIRiskLevel(str, Enum):
    """Risk levels for AI assessments."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class AIGrowthSpeed(str, Enum):
    """Growth speed recommendations."""
    SLOW = "slow"
    MODERATE = "moderate"
    FAST = "fast"
    AGGRESSIVE = "aggressive"


class AIRecommendation(BaseModel):
    """Base model for AI recommendations."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    module_type: AIModuleType
    title: str
    description: str
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.8)
    priority: str = Field(default="medium")  # low, medium, high, critical
    action_items: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    admin_approved: bool = False
    admin_notes: Optional[str] = None


class AIGrowthPlan(BaseModel):
    """AI-generated growth plan for a user."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    instagram_account_id: Optional[str] = None
    
    # Plan details
    recommended_speed: AIGrowthSpeed = AIGrowthSpeed.MODERATE
    daily_target_min: int = Field(default=10, ge=0)
    daily_target_max: int = Field(default=50, ge=0)
    
    # Targeting recommendations
    targeting_priorities: List[str] = Field(default_factory=list)
    recommended_hashtags: List[str] = Field(default_factory=list)
    recommended_similar_accounts: List[str] = Field(default_factory=list)
    
    # Safety settings
    risk_mode: AIRiskLevel = AIRiskLevel.LOW
    safety_level: str = Field(default="high")  # low, medium, high
    
    # Analysis context
    niche: Optional[str] = None
    account_health_score: float = Field(default=0.8, ge=0.0, le=1.0)
    engagement_rate: Optional[float] = None
    
    # Plan lifecycle
    status: str = Field(default="active")  # draft, active, paused, completed, cancelled
    review_cycle_days: int = Field(default=7)
    next_review_date: Optional[datetime] = None
    
    # AI reasoning
    ai_reasoning: str = ""
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0)
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    admin_approved: bool = False
    admin_override_notes: Optional[str] = None


class AIAnalyticsInsight(BaseModel):
    """AI-generated analytics insight."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    insight_type: str  # performance, trend, anomaly, prediction, comparison
    title: str
    summary: str
    detailed_analysis: str
    
    # Data context
    metrics_analyzed: List[str] = Field(default_factory=list)
    time_period: str = ""  # e.g., "last_7_days", "last_30_days"
    
    # Recommendations
    recommendations: List[str] = Field(default_factory=list)
    action_required: bool = False
    
    # Confidence
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0)
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None


class AIRiskAssessment(BaseModel):
    """AI risk assessment for an account or platform."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    target_type: str  # user, account, platform
    target_id: Optional[str] = None
    
    # Risk analysis
    overall_risk_level: AIRiskLevel = AIRiskLevel.LOW
    risk_factors: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Recommendations
    mitigation_actions: List[str] = Field(default_factory=list)
    immediate_actions_required: bool = False
    
    # AI reasoning
    ai_reasoning: str = ""
    confidence_score: float = Field(default=0.8, ge=0.0, le=1.0)
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_by_admin: bool = False


class AIConversation(BaseModel):
    """AI conversation session for admin chat."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_id: str
    title: str = Field(default="New Conversation")
    
    # Conversation state
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    context: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True


class AISettings(BaseModel):
    """Platform AI settings controlled by admin."""
    id: str = Field(default="ai_settings_main")
    
    # Module toggles
    growth_planning_enabled: bool = True
    analytics_intelligence_enabled: bool = True
    decision_support_enabled: bool = True
    risk_assessment_enabled: bool = True
    
    # Provider settings
    primary_provider: AIProvider = AIProvider.OPENAI
    primary_model: str = "gpt-5.2"
    fallback_provider: AIProvider = AIProvider.ANTHROPIC
    fallback_model: str = "claude-sonnet-4-5-20250929"
    
    # Learning settings
    learning_enabled: bool = True
    learning_sensitivity: float = Field(default=0.5, ge=0.0, le=1.0)
    
    # Risk thresholds
    risk_threshold_warning: float = Field(default=0.6, ge=0.0, le=1.0)
    risk_threshold_critical: float = Field(default=0.8, ge=0.0, le=1.0)
    
    # Plan limits per tier
    plan_limits: Dict[str, Dict[str, int]] = Field(default_factory=lambda: {
        "starter": {"daily_max": 30, "requests_per_day": 5},
        "growth": {"daily_max": 75, "requests_per_day": 20},
        "pro": {"daily_max": 150, "requests_per_day": 50},
        "enterprise": {"daily_max": 300, "requests_per_day": -1}  # unlimited
    })
    
    # Metadata
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None


class AILog(BaseModel):
    """Audit log for AI activities."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Activity details
    module_type: AIModuleType
    action: str  # generate_plan, analyze, chat_response, assess_risk
    input_summary: str
    output_summary: str
    
    # Context
    admin_id: Optional[str] = None
    user_id: Optional[str] = None
    target_id: Optional[str] = None
    
    # AI details
    provider_used: AIProvider
    model_used: str
    tokens_used: int = 0
    response_time_ms: int = 0
    
    # Status
    success: bool = True
    error_message: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
