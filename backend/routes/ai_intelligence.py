"""
Adverlyx Intelligence API Routes
Enterprise-grade AI endpoints for admin decision support
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import logging
import json

from models.ai_intelligence import (
    AIModuleType, AIProvider, AIRiskLevel, AIGrowthSpeed,
    AIGrowthPlan, AIAnalyticsInsight, AIRiskAssessment,
    AIConversation, AISettings, AILog, AIRecommendation
)
from utils.ai_service import get_ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/ai", tags=["AI Intelligence"])

# Database reference
db = None

def init_router(database):
    """Initialize router with database connection."""
    global db
    db = database


# ============== Request/Response Models ==============

class ChatRequest(BaseModel):
    """Request model for AI chat."""
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    """Response model for AI chat."""
    response: str
    conversation_id: str
    provider_used: str
    model_used: str
    response_time_ms: int


class GrowthPlanRequest(BaseModel):
    """Request model for generating a growth plan."""
    user_id: str
    include_targeting: bool = True
    include_history: bool = True


class AnalyticsRequest(BaseModel):
    """Request model for analytics analysis."""
    analysis_type: str = Field(default="general")  # general, performance, trends, anomalies
    time_period: str = Field(default="last_30_days")  # last_7_days, last_30_days, last_90_days
    metrics: List[str] = Field(default_factory=list)  # specific metrics to analyze


class RiskAssessmentRequest(BaseModel):
    """Request model for risk assessment."""
    target_type: str = Field(..., pattern="^(user|account|platform)$")
    target_id: Optional[str] = None
    additional_context: Optional[str] = None


class AISettingsUpdate(BaseModel):
    """Request model for updating AI settings."""
    growth_planning_enabled: Optional[bool] = None
    analytics_intelligence_enabled: Optional[bool] = None
    decision_support_enabled: Optional[bool] = None
    risk_assessment_enabled: Optional[bool] = None
    primary_provider: Optional[str] = None
    primary_model: Optional[str] = None
    fallback_provider: Optional[str] = None
    fallback_model: Optional[str] = None
    learning_enabled: Optional[bool] = None
    learning_sensitivity: Optional[float] = None
    risk_threshold_warning: Optional[float] = None
    risk_threshold_critical: Optional[float] = None


# ============== Helper Functions ==============

async def get_current_admin(authorization: str = Header(...)) -> dict:
    """Verify admin authentication."""
    from utils.auth import decode_token
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"id": payload.get("user_id")}, {"_id": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user


async def get_ai_settings() -> AISettings:
    """Get current AI settings."""
    settings = await db.ai_settings.find_one({"id": "ai_settings_main"}, {"_id": 0})
    if settings:
        return AISettings(**settings)
    
    # Create default settings
    default_settings = AISettings()
    await db.ai_settings.insert_one(default_settings.model_dump())
    return default_settings


async def log_ai_activity(
    module_type: AIModuleType,
    action: str,
    input_summary: str,
    output_summary: str,
    admin_id: Optional[str] = None,
    user_id: Optional[str] = None,
    provider: str = "openai",
    model: str = "gpt-5.2",
    response_time_ms: int = 0,
    success: bool = True,
    error_message: Optional[str] = None
):
    """Log AI activity for audit purposes."""
    log = AILog(
        module_type=module_type,
        action=action,
        input_summary=input_summary[:500],
        output_summary=output_summary[:500],
        admin_id=admin_id,
        user_id=user_id,
        provider_used=AIProvider(provider),
        model_used=model,
        response_time_ms=response_time_ms,
        success=success,
        error_message=error_message
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.ai_logs.insert_one(log_dict)


# ============== AI Chat Endpoints ==============

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(request: ChatRequest, admin: dict = Depends(get_current_admin)):
    """
    AI Decision Support Chat
    Allows admins to ask questions and get AI-powered insights.
    """
    settings = await get_ai_settings()
    
    if not settings.decision_support_enabled:
        raise HTTPException(status_code=403, detail="AI Decision Support is currently disabled")
    
    try:
        ai_service = get_ai_service()
        
        # Get or create conversation
        conversation_id = request.conversation_id
        if not conversation_id:
            import uuid
            conversation_id = str(uuid.uuid4())
            
            # Create new conversation
            conversation = AIConversation(
                id=conversation_id,
                admin_id=admin['id'],
                title=request.message[:50] + "..." if len(request.message) > 50 else request.message
            )
            conv_dict = conversation.model_dump()
            conv_dict['created_at'] = conv_dict['created_at'].isoformat()
            conv_dict['updated_at'] = conv_dict['updated_at'].isoformat()
            await db.ai_conversations.insert_one(conv_dict)
        
        # Send message to AI
        result = await ai_service.chat(
            admin_id=admin['id'],
            conversation_id=conversation_id,
            message=request.message,
            context=request.context
        )
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=f"AI request failed: {result.get('error', 'Unknown error')}")
        
        # Update conversation with new message
        await db.ai_conversations.update_one(
            {"id": conversation_id},
            {
                "$push": {
                    "messages": {
                        "role": "user",
                        "content": request.message,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                },
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
        await db.ai_conversations.update_one(
            {"id": conversation_id},
            {
                "$push": {
                    "messages": {
                        "role": "assistant",
                        "content": result['response'],
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        )
        
        # Log activity
        await log_ai_activity(
            module_type=AIModuleType.DECISION_SUPPORT,
            action="chat_response",
            input_summary=request.message,
            output_summary=result['response'][:500],
            admin_id=admin['id'],
            provider=result['provider'],
            model=result['model'],
            response_time_ms=result['response_time_ms']
        )
        
        return ChatResponse(
            response=result['response'],
            conversation_id=conversation_id,
            provider_used=result['provider'],
            model_used=result['model'],
            response_time_ms=result['response_time_ms']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations")
async def get_conversations(
    limit: int = 20,
    admin: dict = Depends(get_current_admin)
):
    """Get admin's AI conversation history."""
    conversations = await db.ai_conversations.find(
        {"admin_id": admin['id'], "is_active": True},
        {"_id": 0, "messages": {"$slice": -1}}  # Only get last message
    ).sort("updated_at", -1).limit(limit).to_list(length=limit)
    
    return {"conversations": conversations}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Get a specific conversation with full message history."""
    conversation = await db.ai_conversations.find_one(
        {"id": conversation_id, "admin_id": admin['id']},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Delete (archive) a conversation."""
    result = await db.ai_conversations.update_one(
        {"id": conversation_id, "admin_id": admin['id']},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"message": "Conversation archived"}


# ============== Growth Planning Endpoints ==============

@router.post("/growth-plan/generate")
async def generate_growth_plan(
    request: GrowthPlanRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    Generate an AI-powered growth plan for a user.
    """
    settings = await get_ai_settings()
    
    if not settings.growth_planning_enabled:
        raise HTTPException(status_code=403, detail="AI Growth Planning is currently disabled")
    
    # Get user data
    user = await db.users.find_one({"id": request.user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get targeting data if requested
    targeting_data = None
    if request.include_targeting:
        targeting = await db.targeting_settings.find_one({"user_id": request.user_id}, {"_id": 0})
        if targeting:
            targeting_data = targeting
    
    # Get historical growth if requested
    historical_growth = None
    if request.include_history:
        history = await db.growth_logs.find(
            {"user_id": request.user_id}
        ).sort("created_at", -1).limit(30).to_list(length=30)
        if history:
            historical_growth = [{k: v for k, v in h.items() if k != '_id'} for h in history]
    
    try:
        ai_service = get_ai_service()
        result = await ai_service.generate_growth_plan(
            user_data=user,
            targeting_data=targeting_data,
            historical_growth=historical_growth
        )
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=f"AI request failed: {result.get('error', 'Unknown error')}")
        
        # Create growth plan record
        plan = AIGrowthPlan(
            user_id=request.user_id,
            ai_reasoning=result['response'],
            status="draft"
        )
        
        # Try to parse structured response
        try:
            # Extract JSON from response
            response_text = result['response']
            if '```json' in response_text:
                json_str = response_text.split('```json')[1].split('```')[0]
            elif '{' in response_text:
                start = response_text.index('{')
                end = response_text.rindex('}') + 1
                json_str = response_text[start:end]
            else:
                json_str = None
            
            if json_str:
                parsed = json.loads(json_str)
                plan.recommended_speed = AIGrowthSpeed(parsed.get('recommended_speed', 'moderate'))
                plan.daily_target_min = parsed.get('daily_target_min', 10)
                plan.daily_target_max = parsed.get('daily_target_max', 50)
                plan.targeting_priorities = parsed.get('targeting_priorities', [])
                plan.recommended_hashtags = parsed.get('recommended_hashtags', [])
                plan.risk_mode = AIRiskLevel(parsed.get('risk_level', 'low'))
                plan.safety_level = parsed.get('safety_level', 'high')
                plan.review_cycle_days = parsed.get('review_cycle_days', 7)
        except Exception as parse_error:
            logger.warning(f"Could not parse structured response: {parse_error}")
        
        # Save plan
        plan_dict = plan.model_dump()
        plan_dict['created_at'] = plan_dict['created_at'].isoformat()
        plan_dict['updated_at'] = plan_dict['updated_at'].isoformat()
        if plan_dict.get('next_review_date'):
            plan_dict['next_review_date'] = plan_dict['next_review_date'].isoformat()
        await db.ai_growth_plans.insert_one(plan_dict)
        
        # Log activity
        await log_ai_activity(
            module_type=AIModuleType.GROWTH_PLANNING,
            action="generate_plan",
            input_summary=f"Growth plan for user {request.user_id}",
            output_summary=result['response'][:500],
            admin_id=admin['id'],
            user_id=request.user_id,
            provider=result['provider'],
            model=result['model'],
            response_time_ms=result['response_time_ms']
        )
        
        return {
            "plan_id": plan.id,
            "plan": plan.model_dump(),
            "raw_response": result['response'],
            "provider_used": result['provider'],
            "model_used": result['model']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Growth plan generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/growth-plans")
async def get_growth_plans(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    admin: dict = Depends(get_current_admin)
):
    """Get AI growth plans with optional filters."""
    query = {}
    if user_id:
        query["user_id"] = user_id
    if status:
        query["status"] = status
    
    plans = await db.ai_growth_plans.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {"plans": plans, "total": len(plans)}


@router.put("/growth-plans/{plan_id}/approve")
async def approve_growth_plan(
    plan_id: str,
    notes: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Approve an AI growth plan."""
    result = await db.ai_growth_plans.update_one(
        {"id": plan_id},
        {
            "$set": {
                "admin_approved": True,
                "admin_override_notes": notes,
                "status": "active",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {"message": "Plan approved and activated"}


# ============== Analytics Intelligence Endpoints ==============

@router.post("/analytics/analyze")
async def analyze_analytics(
    request: AnalyticsRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    AI-powered analytics analysis.
    Interprets platform data and provides actionable insights.
    """
    settings = await get_ai_settings()
    
    if not settings.analytics_intelligence_enabled:
        raise HTTPException(status_code=403, detail="AI Analytics Intelligence is currently disabled")
    
    # Gather analytics data based on time period
    days_map = {
        "last_7_days": 7,
        "last_30_days": 30,
        "last_90_days": 90
    }
    days = days_map.get(request.time_period, 30)
    
    from datetime import timedelta
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Collect platform metrics
    analytics_data = {
        "time_period": request.time_period,
        "metrics": {}
    }
    
    # User metrics
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"status": "active"})
    new_users = await db.users.count_documents({"created_at": {"$gte": start_date.isoformat()}})
    analytics_data["metrics"]["users"] = {
        "total": total_users,
        "active": active_users,
        "new_in_period": new_users
    }
    
    # Subscription metrics
    total_subs = await db.subscriptions.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    analytics_data["metrics"]["subscriptions"] = {
        "total": total_subs,
        "active": active_subs
    }
    
    # Payment metrics
    payments = await db.payments.find(
        {"created_at": {"$gte": start_date.isoformat()}, "status": "completed"}
    ).to_list(length=1000)
    total_revenue = sum(p.get('amount', 0) for p in payments)
    analytics_data["metrics"]["revenue"] = {
        "total_in_period": total_revenue,
        "transaction_count": len(payments)
    }
    
    # Ticket metrics
    open_tickets = await db.tickets.count_documents({"status": "open"})
    analytics_data["metrics"]["support"] = {
        "open_tickets": open_tickets
    }
    
    try:
        ai_service = get_ai_service()
        result = await ai_service.analyze_analytics(
            analytics_data=analytics_data,
            analysis_type=request.analysis_type
        )
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=f"AI request failed: {result.get('error', 'Unknown error')}")
        
        # Create insight record
        insight = AIAnalyticsInsight(
            insight_type=request.analysis_type,
            title=f"Analytics Analysis - {request.time_period}",
            summary=result['response'][:500],
            detailed_analysis=result['response'],
            metrics_analyzed=list(analytics_data['metrics'].keys()),
            time_period=request.time_period
        )
        
        insight_dict = insight.model_dump()
        insight_dict['created_at'] = insight_dict['created_at'].isoformat()
        if insight_dict.get('expires_at'):
            insight_dict['expires_at'] = insight_dict['expires_at'].isoformat()
        await db.ai_analytics_insights.insert_one(insight_dict)
        
        # Log activity
        await log_ai_activity(
            module_type=AIModuleType.ANALYTICS_INTELLIGENCE,
            action="analyze",
            input_summary=f"Analytics analysis: {request.analysis_type} for {request.time_period}",
            output_summary=result['response'][:500],
            admin_id=admin['id'],
            provider=result['provider'],
            model=result['model'],
            response_time_ms=result['response_time_ms']
        )
        
        return {
            "insight_id": insight.id,
            "analysis": result['response'],
            "data_analyzed": analytics_data,
            "provider_used": result['provider'],
            "model_used": result['model']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analytics analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/insights")
async def get_analytics_insights(
    limit: int = 20,
    admin: dict = Depends(get_current_admin)
):
    """Get historical analytics insights."""
    insights = await db.ai_analytics_insights.find(
        {}, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {"insights": insights}


# ============== Risk Assessment Endpoints ==============

@router.post("/risk/assess")
async def assess_risk(
    request: RiskAssessmentRequest,
    admin: dict = Depends(get_current_admin)
):
    """
    AI-powered risk assessment.
    Analyzes potential risks for users, accounts, or platform.
    """
    settings = await get_ai_settings()
    
    if not settings.risk_assessment_enabled:
        raise HTTPException(status_code=403, detail="AI Risk Assessment is currently disabled")
    
    # Gather target data
    target_data = {}
    
    if request.target_type == "user" and request.target_id:
        user = await db.users.find_one({"id": request.target_id}, {"_id": 0, "password_hash": 0})
        if user:
            target_data = user
            # Get user's subscription
            sub = await db.subscriptions.find_one({"user_id": request.target_id}, {"_id": 0})
            if sub:
                target_data["subscription"] = sub
    elif request.target_type == "account" and request.target_id:
        account = await db.instagram_accounts.find_one({"id": request.target_id}, {"_id": 0})
        if account:
            target_data = account
    elif request.target_type == "platform":
        # Platform-wide metrics
        target_data = {
            "total_users": await db.users.count_documents({}),
            "active_subscriptions": await db.subscriptions.count_documents({"status": "active"}),
            "open_tickets": await db.tickets.count_documents({"status": "open"}),
            "recent_payments": await db.payments.count_documents({
                "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
            })
        }
    
    if not target_data:
        raise HTTPException(status_code=404, detail=f"{request.target_type.capitalize()} not found")
    
    try:
        ai_service = get_ai_service()
        result = await ai_service.assess_risk(
            target_type=request.target_type,
            target_data=target_data,
            additional_context=request.additional_context
        )
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=f"AI request failed: {result.get('error', 'Unknown error')}")
        
        # Create assessment record
        assessment = AIRiskAssessment(
            target_type=request.target_type,
            target_id=request.target_id,
            ai_reasoning=result['response']
        )
        
        assessment_dict = assessment.model_dump()
        assessment_dict['created_at'] = assessment_dict['created_at'].isoformat()
        await db.ai_risk_assessments.insert_one(assessment_dict)
        
        # Log activity
        await log_ai_activity(
            module_type=AIModuleType.RISK_ASSESSMENT,
            action="assess_risk",
            input_summary=f"Risk assessment for {request.target_type}: {request.target_id or 'platform'}",
            output_summary=result['response'][:500],
            admin_id=admin['id'],
            user_id=request.target_id if request.target_type == "user" else None,
            provider=result['provider'],
            model=result['model'],
            response_time_ms=result['response_time_ms']
        )
        
        return {
            "assessment_id": assessment.id,
            "assessment": result['response'],
            "target_data": target_data,
            "provider_used": result['provider'],
            "model_used": result['model']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Risk assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk/assessments")
async def get_risk_assessments(
    target_type: Optional[str] = None,
    limit: int = 20,
    admin: dict = Depends(get_current_admin)
):
    """Get historical risk assessments."""
    query = {}
    if target_type:
        query["target_type"] = target_type
    
    assessments = await db.ai_risk_assessments.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {"assessments": assessments}


# ============== AI Settings Endpoints ==============

@router.get("/settings")
async def get_ai_settings_endpoint(admin: dict = Depends(get_current_admin)):
    """Get current AI settings."""
    settings = await get_ai_settings()
    return settings.model_dump()


@router.put("/settings")
async def update_ai_settings(
    update: AISettingsUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update AI settings."""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = admin['id']
    
    result = await db.ai_settings.update_one(
        {"id": "ai_settings_main"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "AI settings updated", "updated_fields": list(update_data.keys())}


# ============== AI Logs Endpoints ==============

@router.get("/logs")
async def get_ai_logs(
    module_type: Optional[str] = None,
    limit: int = 50,
    admin: dict = Depends(get_current_admin)
):
    """Get AI activity logs for audit purposes."""
    query = {}
    if module_type:
        query["module_type"] = module_type
    
    logs = await db.ai_logs.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    return {"logs": logs, "total": len(logs)}


@router.get("/stats")
async def get_ai_stats(admin: dict = Depends(get_current_admin)):
    """Get AI usage statistics."""
    # Count by module
    growth_plans = await db.ai_growth_plans.count_documents({})
    analytics_insights = await db.ai_analytics_insights.count_documents({})
    risk_assessments = await db.ai_risk_assessments.count_documents({})
    conversations = await db.ai_conversations.count_documents({"is_active": True})
    
    # Recent activity
    from datetime import timedelta
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_logs = await db.ai_logs.count_documents({"created_at": {"$gte": week_ago}})
    
    # Success rate
    total_logs = await db.ai_logs.count_documents({})
    successful_logs = await db.ai_logs.count_documents({"success": True})
    success_rate = (successful_logs / total_logs * 100) if total_logs > 0 else 100
    
    return {
        "total_growth_plans": growth_plans,
        "total_analytics_insights": analytics_insights,
        "total_risk_assessments": risk_assessments,
        "active_conversations": conversations,
        "requests_last_7_days": recent_logs,
        "success_rate": round(success_rate, 2)
    }
