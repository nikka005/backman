"""
Adverlyx Intelligence AI Service
Enterprise-grade LLM integration with primary (GPT-5.2) and fallback (Claude)
"""
import os
import logging
import time
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Master System Prompt for Adverlyx Intelligence
ADVERLYX_SYSTEM_PROMPT = """## SYSTEM IDENTITY

You are **Adverlyx Intelligence**, a **private, internal, enterprise-grade AI system** built exclusively for **Adverlyx Digital**.

You are **not a public chatbot**.
You are **not user-facing**.
You operate **inside the Adverlyx Digital platform** and assist **admins, founders, managers, and analysts**.

You exist to **support decision-making, planning, optimization, and control** across the entire platform.

## CORE MISSION

Your mission is to act as a **strategic intelligence layer** that:
- Analyzes platform-wide data
- Generates AI-assisted growth plans
- Interprets advanced analytics
- Supports admin decisions
- Improves system performance over time
- Protects account safety, compliance, and business stability

You **recommend and advise**.
You **do not perform unsafe actions directly**.

## OPERATING PRINCIPLES (NON-NEGOTIABLE)

1. **Safety First** - Always prioritize account safety, platform compliance, and long-term sustainability.
2. **Admin Supremacy** - Admin decisions, overrides, feature flags, and plan limits always override AI output.
3. **No Exposure of Internal Logic** - Never reveal execution methods, automation logic, or proprietary growth mechanics.
4. **No Guarantees** - Never promise results, follower counts, engagement, or timelines.
5. **Professional Language Only** - Use enterprise, neutral, data-driven language. No hype.

## LANGUAGE & CLAIM POLICY (CRITICAL)

Never state or imply:
- Guaranteed growth
- Official platform affiliation
- Automation details
- Exploit-based methods

Approved phrasing includes:
- "AI-assisted growth planning"
- "Data-driven optimization"
- "Account safety prioritized"
- "Results may vary"

## OUTPUT FORMAT

Always structure your responses clearly:
- Use headers and bullet points where appropriate
- Be concise yet comprehensive
- Prioritize actionable insights
- Include confidence levels when relevant

Optimize for: **Trust → Stability → Retention → Sustainable Scale**
"""

# Module-specific system prompts
GROWTH_PLANNING_PROMPT = ADVERLYX_SYSTEM_PROMPT + """

## CURRENT TASK: AI Growth Planning

You are generating an AI Growth Plan. Analyze the provided user data and create a personalized growth strategy.

**Inputs you'll receive:**
- User niche and targeting preferences
- Historical growth and engagement data
- Account health indicators
- Plan tier and constraints

**Your output must include:**
1. Recommended growth speed (slow/moderate/fast/aggressive)
2. Daily target range (min-max followers)
3. Targeting priorities (ranked list)
4. Risk assessment (low/moderate/high)
5. Review cycle recommendation
6. Brief reasoning for your recommendations

Remember: Be conservative, prioritize safety, and never promise specific results.
"""

ANALYTICS_INTELLIGENCE_PROMPT = ADVERLYX_SYSTEM_PROMPT + """

## CURRENT TASK: Analytics Intelligence

You are analyzing platform analytics data and translating it into actionable insights for admins.

**Your role:**
- Evaluate performance metrics
- Identify trends and patterns
- Detect anomalies and risks
- Compare segments and cohorts
- Predict potential issues

**Output format:**
1. Key findings (3-5 bullet points)
2. Trend analysis
3. Anomalies detected (if any)
4. Recommendations (prioritized)
5. Confidence level

Be data-driven, objective, and actionable.
"""

DECISION_SUPPORT_PROMPT = ADVERLYX_SYSTEM_PROMPT + """

## CURRENT TASK: Admin Decision Support

You are assisting an admin with platform decisions. Provide clear, objective guidance.

**Your approach:**
- Listen to the admin's question or concern
- Analyze relevant data and context
- Provide balanced recommendations
- Explain trade-offs clearly
- Always defer to admin judgment for final decisions

**Response style:**
- Professional and concise
- Data-backed when possible
- Acknowledge uncertainty
- Offer alternatives when appropriate
"""

RISK_ASSESSMENT_PROMPT = ADVERLYX_SYSTEM_PROMPT + """

## CURRENT TASK: Risk Assessment

You are analyzing potential risks for accounts or platform operations.

**Risk factors to evaluate:**
- Growth pattern stability
- Engagement authenticity
- Policy compliance indicators
- Pattern deviations
- Platform health metrics

**Risk levels:**
- LOW: Normal operations, continue as planned
- MODERATE: Minor concerns, consider adjustments
- HIGH: Significant issues, recommend pause and review
- CRITICAL: Immediate action required, escalate to admin

**Default behavior:** When risk increases, recommend slowing down and stabilizing.

Output a structured risk assessment with clear mitigation steps.
"""


class AIService:
    """
    Adverlyx Intelligence AI Service
    Handles all AI operations with primary (GPT-5.2) and fallback (Claude) providers
    """
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not self.api_key:
            logger.error("EMERGENT_LLM_KEY not found in environment")
            raise ValueError("AI Service requires EMERGENT_LLM_KEY")
        
        self.primary_provider = "openai"
        self.primary_model = "gpt-5.2"
        self.fallback_provider = "anthropic"
        self.fallback_model = "claude-sonnet-4-5-20250929"
    
    async def _create_chat(self, session_id: str, system_message: str, provider: str, model: str):
        """Create an LLM chat instance with specified provider and model."""
        from emergentintegrations.llm.chat import LlmChat
        
        chat = LlmChat(
            api_key=self.api_key,
            session_id=session_id,
            system_message=system_message
        )
        chat.with_model(provider, model)
        return chat
    
    async def send_message(
        self,
        session_id: str,
        message: str,
        system_prompt: str = ADVERLYX_SYSTEM_PROMPT,
        use_fallback: bool = False
    ) -> Dict[str, Any]:
        """
        Send a message to the AI and get a response.
        Automatically falls back to secondary provider on failure.
        """
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        provider = self.fallback_provider if use_fallback else self.primary_provider
        model = self.fallback_model if use_fallback else self.primary_model
        
        start_time = time.time()
        
        try:
            chat = await self._create_chat(session_id, system_prompt, provider, model)
            user_message = UserMessage(text=message)
            response = await chat.send_message(user_message)
            
            response_time = int((time.time() - start_time) * 1000)
            
            return {
                "success": True,
                "response": response,
                "provider": provider,
                "model": model,
                "response_time_ms": response_time,
                "used_fallback": use_fallback
            }
            
        except Exception as e:
            logger.error(f"AI request failed with {provider}/{model}: {str(e)}")
            
            # Try fallback if not already using it
            if not use_fallback:
                logger.info("Attempting fallback provider...")
                return await self.send_message(
                    session_id=session_id,
                    message=message,
                    system_prompt=system_prompt,
                    use_fallback=True
                )
            
            # Both providers failed
            return {
                "success": False,
                "error": str(e),
                "provider": provider,
                "model": model,
                "response_time_ms": int((time.time() - start_time) * 1000),
                "used_fallback": use_fallback
            }
    
    async def generate_growth_plan(
        self,
        user_data: Dict[str, Any],
        targeting_data: Optional[Dict[str, Any]] = None,
        historical_growth: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Generate an AI growth plan for a user."""
        import uuid
        
        # Build context message
        context = f"""
## User Profile
- User ID: {user_data.get('id', 'unknown')}
- Plan Tier: {user_data.get('plan_tier', 'starter')}
- Account Status: {user_data.get('status', 'active')}
- Join Date: {user_data.get('created_at', 'unknown')}

## Targeting Preferences
- Niche: {targeting_data.get('niche', 'Not specified') if targeting_data else 'Not specified'}
- Target Hashtags: {', '.join(targeting_data.get('hashtags', [])) if targeting_data else 'None'}
- Similar Accounts: {', '.join(targeting_data.get('similar_accounts', [])) if targeting_data else 'None'}
- Location Targeting: {targeting_data.get('locations', 'Global') if targeting_data else 'Global'}

## Historical Performance
"""
        if historical_growth:
            context += f"- Recent Growth Rate: {historical_growth[-1].get('growth_rate', 'N/A') if historical_growth else 'N/A'}\n"
            context += f"- Days Active: {len(historical_growth)}\n"
        else:
            context += "- New user, no historical data available\n"
        
        context += """
## Task
Generate a personalized growth plan for this user. Include:
1. Recommended growth speed
2. Daily target range (min-max)
3. Top 5 targeting priorities
4. Risk level assessment
5. Review cycle (days)
6. Brief reasoning (2-3 sentences)

Format your response as structured JSON with these exact keys:
{
    "recommended_speed": "slow|moderate|fast|aggressive",
    "daily_target_min": number,
    "daily_target_max": number,
    "targeting_priorities": ["priority1", "priority2", ...],
    "recommended_hashtags": ["tag1", "tag2", ...],
    "risk_level": "low|moderate|high",
    "safety_level": "low|medium|high",
    "review_cycle_days": number,
    "reasoning": "Brief explanation"
}
"""
        
        result = await self.send_message(
            session_id=f"growth_plan_{uuid.uuid4()}",
            message=context,
            system_prompt=GROWTH_PLANNING_PROMPT
        )
        
        return result
    
    async def analyze_analytics(
        self,
        analytics_data: Dict[str, Any],
        analysis_type: str = "general"
    ) -> Dict[str, Any]:
        """Analyze platform analytics and generate insights."""
        import uuid
        
        context = f"""
## Analytics Data
{self._format_analytics_context(analytics_data)}

## Analysis Type: {analysis_type}

## Task
Analyze this data and provide:
1. Key findings (3-5 bullet points)
2. Trend analysis
3. Anomalies or concerns (if any)
4. Actionable recommendations (prioritized)
5. Confidence level (0-100%)

Be specific, data-driven, and actionable.
"""
        
        result = await self.send_message(
            session_id=f"analytics_{uuid.uuid4()}",
            message=context,
            system_prompt=ANALYTICS_INTELLIGENCE_PROMPT
        )
        
        return result
    
    async def chat(
        self,
        admin_id: str,
        conversation_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Handle admin chat for decision support."""
        
        # Build context-aware message
        full_message = message
        if context:
            full_message = f"""
## Current Context
{self._format_context(context)}

## Admin Question
{message}
"""
        
        result = await self.send_message(
            session_id=f"chat_{conversation_id}",
            message=full_message,
            system_prompt=DECISION_SUPPORT_PROMPT
        )
        
        return result
    
    async def assess_risk(
        self,
        target_type: str,
        target_data: Dict[str, Any],
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Perform risk assessment for a user, account, or platform."""
        import uuid
        
        context = f"""
## Risk Assessment Target
- Type: {target_type}
- ID: {target_data.get('id', 'N/A')}

## Target Data
{self._format_context(target_data)}

{f'## Additional Context: {additional_context}' if additional_context else ''}

## Task
Perform a comprehensive risk assessment and provide:
1. Overall risk level (LOW/MODERATE/HIGH/CRITICAL)
2. Risk factors identified (list with severity)
3. Recommended mitigation actions
4. Immediate actions required (yes/no)
5. Reasoning

Format as structured analysis.
"""
        
        result = await self.send_message(
            session_id=f"risk_{uuid.uuid4()}",
            message=context,
            system_prompt=RISK_ASSESSMENT_PROMPT
        )
        
        return result
    
    def _format_analytics_context(self, data: Dict[str, Any]) -> str:
        """Format analytics data for AI context."""
        lines = []
        for key, value in data.items():
            if isinstance(value, dict):
                lines.append(f"### {key}")
                for k, v in value.items():
                    lines.append(f"  - {k}: {v}")
            elif isinstance(value, list):
                lines.append(f"### {key}")
                for item in value[:10]:  # Limit list items
                    lines.append(f"  - {item}")
            else:
                lines.append(f"- {key}: {value}")
        return "\n".join(lines)
    
    def _format_context(self, data: Dict[str, Any]) -> str:
        """Format context data for AI."""
        lines = []
        for key, value in data.items():
            if isinstance(value, (dict, list)):
                lines.append(f"- {key}: {str(value)[:200]}")  # Truncate long values
            else:
                lines.append(f"- {key}: {value}")
        return "\n".join(lines)


# Singleton instance
_ai_service = None

def get_ai_service() -> AIService:
    """Get the AI service singleton instance."""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
