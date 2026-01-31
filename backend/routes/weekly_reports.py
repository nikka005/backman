"""
AI Weekly Growth Reports Service
Generates and sends automated weekly growth reports to users
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import logging

from utils.auth import get_current_user, require_roles
from models.user import UserRole
from utils.email import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weekly-reports", tags=["Weekly Reports"])

# Database reference
db = None

def init_router(database):
    """Initialize router with database connection."""
    global db
    db = database


# ============== Email Template ==============

def get_weekly_report_email_html(
    name: str,
    username: str,
    period_start: str,
    period_end: str,
    followers_gained: int,
    followers_total: int,
    engagement_rate: float,
    top_performing_day: str,
    ai_insights: str,
    recommendations: List[str]
) -> str:
    """Generate weekly growth report email HTML."""
    recommendations_html = "".join([f"<li style='margin-bottom: 10px;'>{r}</li>" for r in recommendations])
    
    growth_color = "#10b981" if followers_gained > 0 else "#ef4444"
    growth_icon = "↑" if followers_gained > 0 else "↓"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Weekly Growth Report</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">@{username}</p>
                            </td>
                        </tr>
                        
                        <!-- Period -->
                        <tr>
                            <td style="padding: 20px 40px; background-color: #f9fafb; text-align: center;">
                                <p style="color: #6b7280; margin: 0; font-size: 14px;">{period_start} - {period_end}</p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Here's your Instagram growth summary for the past week:</p>
                                
                                <!-- Stats Grid -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                    <tr>
                                        <td width="50%" style="padding: 15px;">
                                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 20px; text-align: center;">
                                                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Followers Gained</p>
                                                <p style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 5px 0 0;">{growth_icon}{abs(followers_gained)}</p>
                                            </div>
                                        </td>
                                        <td width="50%" style="padding: 15px;">
                                            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 12px; padding: 20px; text-align: center;">
                                                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Total Followers</p>
                                                <p style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 5px 0 0;">{followers_total:,}</p>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td width="50%" style="padding: 15px;">
                                            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 20px; text-align: center;">
                                                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Engagement Rate</p>
                                                <p style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 5px 0 0;">{engagement_rate:.1f}%</p>
                                            </div>
                                        </td>
                                        <td width="50%" style="padding: 15px;">
                                            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 12px; padding: 20px; text-align: center;">
                                                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0;">Best Day</p>
                                                <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 5px 0 0;">{top_performing_day}</p>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- AI Insights -->
                                <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 30px;">
                                    <h3 style="color: #166534; margin: 0 0 10px; font-size: 16px;">AI Insights</h3>
                                    <p style="color: #15803d; margin: 0; font-size: 14px; line-height: 1.6;">{ai_insights}</p>
                                </div>
                                
                                <!-- Recommendations -->
                                <div style="background-color: #faf5ff; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                                    <h3 style="color: #7c3aed; margin: 0 0 15px; font-size: 16px;">Recommendations for Next Week</h3>
                                    <ul style="color: #6b21a8; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                                        {recommendations_html}
                                    </ul>
                                </div>
                                
                                <!-- CTA -->
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="https://adverlyx.digital/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Full Dashboard</a>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">You're receiving this because you have weekly reports enabled.</p>
                                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">&copy; 2026 Adverlyx Digital. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


# ============== API Endpoints ==============

class WeeklyReportRequest(BaseModel):
    user_id: Optional[str] = None  # If None, send to all subscribed users


class WeeklyReportResponse(BaseModel):
    success: bool
    reports_sent: int
    failed: int
    message: str


async def generate_user_report(user: dict, account: dict) -> dict:
    """Generate a weekly report for a single user."""
    from utils.ai_service import get_ai_service
    
    # Calculate period
    now = datetime.now(timezone.utc)
    period_end = now
    period_start = now - timedelta(days=7)
    
    # Get growth data from growth_logs
    growth_logs = await db.growth_logs.find({
        "user_id": user["id"],
        "created_at": {"$gte": period_start.isoformat()}
    }).to_list(1000)
    
    # Calculate stats
    followers_gained = sum(log.get("followers_gained", 0) for log in growth_logs)
    followers_total = account.get("followers_count", 0)
    engagement_rate = account.get("engagement_rate", 0)
    
    # Find best day
    days_growth = {}
    for log in growth_logs:
        day = log.get("created_at", "")[:10]
        days_growth[day] = days_growth.get(day, 0) + log.get("followers_gained", 0)
    
    top_day = "N/A"
    if days_growth:
        best_day = max(days_growth.keys(), key=lambda k: days_growth[k])
        top_day = datetime.fromisoformat(best_day).strftime("%A")
    
    # Generate AI insights
    ai_insights = "Your account is showing steady growth. Keep up the consistent posting schedule!"
    recommendations = [
        "Post during peak engagement hours (6-9 PM)",
        "Engage with your followers' comments within the first hour",
        "Try using 3-5 relevant hashtags per post"
    ]
    
    # Try to get AI-generated insights
    try:
        ai_service = get_ai_service()
        if ai_service:
            prompt = f"""
            Analyze this Instagram account's weekly performance and provide brief insights:
            - Username: @{account.get('username', 'unknown')}
            - Followers gained this week: {followers_gained}
            - Total followers: {followers_total}
            - Engagement rate: {engagement_rate}%
            - Best performing day: {top_day}
            
            Provide:
            1. A brief 2-sentence insight about their performance
            2. Three specific recommendations for improvement
            
            Format your response as JSON:
            {{"insight": "...", "recommendations": ["...", "...", "..."]}}
            """
            
            response = await ai_service.chat(prompt)
            if response and "insight" in response:
                import json
                data = json.loads(response)
                ai_insights = data.get("insight", ai_insights)
                recommendations = data.get("recommendations", recommendations)
    except Exception as e:
        logger.warning(f"AI insights generation failed: {e}")
    
    return {
        "name": user.get("name", "User"),
        "email": user.get("email"),
        "username": account.get("username", "unknown"),
        "period_start": period_start.strftime("%b %d, %Y"),
        "period_end": period_end.strftime("%b %d, %Y"),
        "followers_gained": followers_gained,
        "followers_total": followers_total,
        "engagement_rate": engagement_rate,
        "top_performing_day": top_day,
        "ai_insights": ai_insights,
        "recommendations": recommendations
    }


@router.post("/send")
async def send_weekly_reports(
    request: WeeklyReportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
) -> WeeklyReportResponse:
    """Send weekly growth reports to users (admin only)."""
    
    # Find users to send reports to
    query = {"status": "active"}
    if request.user_id:
        query["id"] = request.user_id
    
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    
    reports_sent = 0
    failed = 0
    
    for user in users:
        try:
            # Get user's Instagram account
            account = await db.instagram_accounts.find_one(
                {"user_id": user["id"]},
                {"_id": 0}
            )
            
            if not account:
                continue
            
            # Generate report data
            report_data = await generate_user_report(user, account)
            
            # Generate email HTML
            html = get_weekly_report_email_html(
                name=report_data["name"],
                username=report_data["username"],
                period_start=report_data["period_start"],
                period_end=report_data["period_end"],
                followers_gained=report_data["followers_gained"],
                followers_total=report_data["followers_total"],
                engagement_rate=report_data["engagement_rate"],
                top_performing_day=report_data["top_performing_day"],
                ai_insights=report_data["ai_insights"],
                recommendations=report_data["recommendations"]
            )
            
            # Send email
            result = await send_email(
                to_email=report_data["email"],
                subject=f"Your Weekly Growth Report - @{report_data['username']}",
                html_content=html
            )
            
            if result:
                reports_sent += 1
                # Log the report
                await db.weekly_reports.insert_one({
                    "user_id": user["id"],
                    "username": report_data["username"],
                    "sent_at": datetime.now(timezone.utc).isoformat(),
                    "data": report_data
                })
            else:
                failed += 1
                
        except Exception as e:
            logger.error(f"Failed to send report to {user.get('email')}: {e}")
            failed += 1
    
    return WeeklyReportResponse(
        success=True,
        reports_sent=reports_sent,
        failed=failed,
        message=f"Successfully sent {reports_sent} reports, {failed} failed"
    )


@router.get("/history")
async def get_report_history(
    user_id: Optional[str] = None,
    limit: int = 20,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Get weekly report sending history."""
    query = {}
    if user_id:
        query["user_id"] = user_id
    
    reports = await db.weekly_reports.find(
        query,
        {"_id": 0}
    ).sort("sent_at", -1).limit(limit).to_list(limit)
    
    return reports


@router.get("/preview/{user_id}")
async def preview_weekly_report(
    user_id: str,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Preview a weekly report for a specific user without sending."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="User has no connected Instagram account")
    
    report_data = await generate_user_report(user, account)
    
    # Return both data and HTML preview
    html = get_weekly_report_email_html(
        name=report_data["name"],
        username=report_data["username"],
        period_start=report_data["period_start"],
        period_end=report_data["period_end"],
        followers_gained=report_data["followers_gained"],
        followers_total=report_data["followers_total"],
        engagement_rate=report_data["engagement_rate"],
        top_performing_day=report_data["top_performing_day"],
        ai_insights=report_data["ai_insights"],
        recommendations=report_data["recommendations"]
    )
    
    return {
        "data": report_data,
        "html_preview": html
    }
