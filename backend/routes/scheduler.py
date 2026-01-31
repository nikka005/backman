"""
Scheduled Tasks / Background Jobs for Adverlyx Digital
Handles automated weekly reports and other scheduled tasks
"""
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from datetime import datetime, timezone, timedelta
from typing import Optional
import asyncio
import logging

from utils.auth import get_current_user, require_roles
from models.user import UserRole
from utils.email import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scheduler", tags=["Scheduler"])

# Database reference
db = None

# Scheduler state
scheduler_running = False
scheduler_task = None

def init_router(database):
    """Initialize router with database connection."""
    global db
    db = database


# ============== Scheduler Configuration ==============

class SchedulerConfig:
    """Configuration for scheduled tasks."""
    WEEKLY_REPORT_DAY = 0  # Monday (0 = Monday, 6 = Sunday)
    WEEKLY_REPORT_HOUR = 9  # 9 AM UTC
    GROWTH_CHECK_INTERVAL_HOURS = 6
    TOKEN_REFRESH_CHECK_HOURS = 24


async def get_scheduler_config():
    """Get scheduler configuration from database or defaults."""
    config = await db.scheduler_config.find_one({}, {"_id": 0})
    if not config:
        return {
            "weekly_report_enabled": True,
            "weekly_report_day": SchedulerConfig.WEEKLY_REPORT_DAY,
            "weekly_report_hour": SchedulerConfig.WEEKLY_REPORT_HOUR,
            "growth_check_enabled": True,
            "growth_check_interval": SchedulerConfig.GROWTH_CHECK_INTERVAL_HOURS,
            "last_weekly_report": None,
            "last_growth_check": None
        }
    return config


async def update_scheduler_config(updates: dict):
    """Update scheduler configuration."""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.scheduler_config.update_one(
        {},
        {"$set": updates},
        upsert=True
    )


# ============== Weekly Reports Task ==============

async def send_weekly_reports_task():
    """Send weekly reports to all eligible users."""
    from routes.weekly_reports import generate_user_report, get_weekly_report_email_html
    
    logger.info("Starting weekly reports task...")
    
    # Get users who have weekly reports enabled
    users = await db.users.find({
        "status": "active",
        "$or": [
            {"notification_preferences.weekly_reports": True},
            {"notification_preferences": {"$exists": False}}  # Default to enabled
        ]
    }, {"_id": 0}).to_list(1000)
    
    reports_sent = 0
    failed = 0
    
    for user in users:
        try:
            # Check if user has an Instagram account
            account = await db.instagram_accounts.find_one(
                {"user_id": user["id"]},
                {"_id": 0}
            )
            
            if not account:
                continue
            
            # Check if user has a subscription (only send to paying users)
            subscription = await db.subscriptions.find_one(
                {"user_id": user["id"], "status": "active"},
                {"_id": 0}
            )
            
            if not subscription:
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
                    "data": report_data,
                    "automated": True
                })
            else:
                failed += 1
                
        except Exception as e:
            logger.error(f"Failed to send report to {user.get('email')}: {e}")
            failed += 1
    
    # Update last run time
    await update_scheduler_config({
        "last_weekly_report": datetime.now(timezone.utc).isoformat(),
        "last_weekly_report_sent": reports_sent,
        "last_weekly_report_failed": failed
    })
    
    logger.info(f"Weekly reports task completed: {reports_sent} sent, {failed} failed")
    return {"sent": reports_sent, "failed": failed}


# ============== Growth Check Task ==============

async def check_growth_completion_task():
    """Check if any users have completed their growth targets."""
    logger.info("Starting growth completion check...")
    
    # Get active subscriptions
    subscriptions = await db.subscriptions.find({
        "status": "active",
        "growth_complete": {"$ne": True}
    }, {"_id": 0}).to_list(1000)
    
    completions = 0
    
    # Plan targets
    plan_targets = {
        "starter": 1500, "basic": 1500,
        "growth": 5000, "pro": 3500,
        "elite": 10000, "enterprise": 10000,
        "business": 50000
    }
    
    for sub in subscriptions:
        try:
            user_id = sub["user_id"]
            plan = sub.get("plan", "").lower()
            target = plan_targets.get(plan, 1500)
            start_followers = sub.get("start_followers", 0)
            
            # Get current follower count
            account = await db.instagram_accounts.find_one(
                {"user_id": user_id},
                {"_id": 0}
            )
            
            if not account:
                continue
            
            current_followers = account.get("followers_count", 0)
            gained = current_followers - start_followers
            
            if gained >= target:
                # Mark subscription as complete
                await db.subscriptions.update_one(
                    {"user_id": user_id},
                    {"$set": {
                        "growth_complete": True,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                        "final_followers_gained": gained
                    }}
                )
                
                # Send completion notification
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                if user:
                    await db.notifications.insert_one({
                        "user_id": user_id,
                        "type": "growth_complete",
                        "title": "Growth Target Achieved! 🎉",
                        "message": f"Congratulations! You've gained {gained:,} followers and completed your {plan.title()} plan target!",
                        "read": False,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                
                completions += 1
                logger.info(f"User {user_id} completed growth target: {gained} followers")
                
        except Exception as e:
            logger.error(f"Error checking growth for user: {e}")
    
    # Update last run time
    await update_scheduler_config({
        "last_growth_check": datetime.now(timezone.utc).isoformat(),
        "last_growth_completions": completions
    })
    
    logger.info(f"Growth check completed: {completions} completions")
    return {"completions": completions}


# ============== Token Refresh Task ==============

async def refresh_expiring_tokens_task():
    """Refresh Instagram tokens that are expiring soon."""
    logger.info("Starting token refresh check...")
    
    # Find accounts with tokens expiring in the next 7 days
    threshold = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    
    accounts = await db.instagram_accounts.find({
        "oauth_connected": True,
        "token_expires_at": {"$lt": threshold}
    }, {"_id": 0}).to_list(100)
    
    refreshed = 0
    failed = 0
    
    import httpx
    import os
    
    INSTAGRAM_APP_SECRET = os.environ.get("INSTAGRAM_APP_SECRET", "")
    
    for account in accounts:
        try:
            access_token = account.get("access_token")
            if not access_token:
                continue
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    "https://graph.instagram.com/refresh_access_token",
                    params={
                        "grant_type": "ig_refresh_token",
                        "access_token": access_token
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    new_token = data.get("access_token")
                    expires_in = data.get("expires_in", 5184000)
                    
                    await db.instagram_accounts.update_one(
                        {"user_id": account["user_id"]},
                        {"$set": {
                            "access_token": new_token,
                            "token_expires_at": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
                            "token_refreshed_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    refreshed += 1
                else:
                    failed += 1
                    logger.warning(f"Failed to refresh token for user {account['user_id']}")
                    
        except Exception as e:
            failed += 1
            logger.error(f"Error refreshing token: {e}")
    
    logger.info(f"Token refresh completed: {refreshed} refreshed, {failed} failed")
    return {"refreshed": refreshed, "failed": failed}


# ============== Main Scheduler Loop ==============

async def scheduler_loop():
    """Main scheduler loop that runs background tasks."""
    global scheduler_running
    
    logger.info("Scheduler started")
    
    while scheduler_running:
        try:
            config = await get_scheduler_config()
            now = datetime.now(timezone.utc)
            
            # Check if it's time for weekly reports
            if config.get("weekly_report_enabled", True):
                last_report = config.get("last_weekly_report")
                if last_report:
                    last_report_dt = datetime.fromisoformat(last_report.replace('Z', '+00:00'))
                    days_since = (now - last_report_dt).days
                else:
                    days_since = 7  # Force run if never run before
                
                # Run weekly reports on the configured day
                if (days_since >= 7 and 
                    now.weekday() == config.get("weekly_report_day", 0) and
                    now.hour >= config.get("weekly_report_hour", 9)):
                    await send_weekly_reports_task()
            
            # Check growth completion periodically
            if config.get("growth_check_enabled", True):
                last_check = config.get("last_growth_check")
                interval = config.get("growth_check_interval", 6)
                
                should_check = True
                if last_check:
                    last_check_dt = datetime.fromisoformat(last_check.replace('Z', '+00:00'))
                    hours_since = (now - last_check_dt).total_seconds() / 3600
                    should_check = hours_since >= interval
                
                if should_check:
                    await check_growth_completion_task()
            
            # Check token refresh daily
            last_token_check = config.get("last_token_refresh_check")
            should_refresh = True
            if last_token_check:
                last_dt = datetime.fromisoformat(last_token_check.replace('Z', '+00:00'))
                hours_since = (now - last_dt).total_seconds() / 3600
                should_refresh = hours_since >= 24
            
            if should_refresh:
                await refresh_expiring_tokens_task()
                await update_scheduler_config({
                    "last_token_refresh_check": now.isoformat()
                })
            
            # Sleep for 1 hour before checking again
            await asyncio.sleep(3600)
            
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            await asyncio.sleep(60)  # Sleep briefly on error
    
    logger.info("Scheduler stopped")


# ============== API Endpoints ==============

@router.get("/status")
async def get_scheduler_status(
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Get current scheduler status and configuration."""
    config = await get_scheduler_config()
    
    return {
        "scheduler_running": scheduler_running,
        "config": config
    }


@router.post("/start")
async def start_scheduler(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Start the background scheduler."""
    global scheduler_running, scheduler_task
    
    if scheduler_running:
        return {"message": "Scheduler already running"}
    
    scheduler_running = True
    background_tasks.add_task(scheduler_loop)
    
    return {"message": "Scheduler started"}


@router.post("/stop")
async def stop_scheduler(
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Stop the background scheduler."""
    global scheduler_running
    
    scheduler_running = False
    
    return {"message": "Scheduler stopping..."}


@router.put("/config")
async def update_config(
    config: dict,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Update scheduler configuration."""
    allowed_fields = [
        "weekly_report_enabled", "weekly_report_day", "weekly_report_hour",
        "growth_check_enabled", "growth_check_interval"
    ]
    
    updates = {k: v for k, v in config.items() if k in allowed_fields}
    
    if updates:
        await update_scheduler_config(updates)
    
    return {"message": "Configuration updated", "updated": updates}


@router.post("/run/weekly-reports")
async def run_weekly_reports_now(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Manually trigger weekly reports."""
    background_tasks.add_task(send_weekly_reports_task)
    return {"message": "Weekly reports task started"}


@router.post("/run/growth-check")
async def run_growth_check_now(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Manually trigger growth completion check."""
    background_tasks.add_task(check_growth_completion_task)
    return {"message": "Growth check task started"}


@router.post("/run/token-refresh")
async def run_token_refresh_now(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(require_roles([UserRole.ADMIN]))
):
    """Manually trigger token refresh."""
    background_tasks.add_task(refresh_expiring_tokens_task)
    return {"message": "Token refresh task started"}
