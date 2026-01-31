"""
User Notification Preferences API Routes
Handles user preferences for email notifications and alerts
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import logging

from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notification-preferences", tags=["Notification Preferences"])

# Database reference
db = None

def init_router(database):
    """Initialize router with database connection."""
    global db
    db = database


# ============== Models ==============

class NotificationPreferences(BaseModel):
    """User notification preferences."""
    email_notifications: bool = True
    growth_milestone_alerts: bool = True
    weekly_reports: bool = True
    promotional_emails: bool = False
    security_alerts: bool = True
    billing_alerts: bool = True
    new_features: bool = True
    tips_and_tricks: bool = True


class NotificationPreferencesUpdate(BaseModel):
    """Partial update for notification preferences."""
    email_notifications: Optional[bool] = None
    growth_milestone_alerts: Optional[bool] = None
    weekly_reports: Optional[bool] = None
    promotional_emails: Optional[bool] = None
    security_alerts: Optional[bool] = None
    billing_alerts: Optional[bool] = None
    new_features: Optional[bool] = None
    tips_and_tricks: Optional[bool] = None


# ============== API Endpoints ==============

@router.get("")
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's notification preferences."""
    user_id = current_user['user_id']
    
    # Get user's preferences from database
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return existing preferences or defaults
    prefs = user.get("notification_preferences", {})
    
    return {
        "email_notifications": prefs.get("email_notifications", True),
        "growth_milestone_alerts": prefs.get("growth_milestone_alerts", True),
        "weekly_reports": prefs.get("weekly_reports", True),
        "promotional_emails": prefs.get("promotional_emails", False),
        "security_alerts": prefs.get("security_alerts", True),
        "billing_alerts": prefs.get("billing_alerts", True),
        "new_features": prefs.get("new_features", True),
        "tips_and_tricks": prefs.get("tips_and_tricks", True)
    }


@router.put("")
async def update_notification_preferences(
    preferences: NotificationPreferencesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's notification preferences."""
    user_id = current_user['user_id']
    
    # Build update dict with only provided fields
    updates = {}
    for field, value in preferences.model_dump(exclude_unset=True).items():
        if value is not None:
            updates[f"notification_preferences.{field}"] = value
    
    if not updates:
        raise HTTPException(status_code=400, detail="No preferences to update")
    
    # Add updated timestamp
    updates["notification_preferences.updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated preferences
    return await get_notification_preferences(current_user)


@router.post("/reset")
async def reset_notification_preferences(
    current_user: dict = Depends(get_current_user)
):
    """Reset notification preferences to defaults."""
    user_id = current_user['user_id']
    
    default_prefs = {
        "email_notifications": True,
        "growth_milestone_alerts": True,
        "weekly_reports": True,
        "promotional_emails": False,
        "security_alerts": True,
        "billing_alerts": True,
        "new_features": True,
        "tips_and_tricks": True,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"notification_preferences": default_prefs}}
    )
    
    return default_prefs


@router.post("/unsubscribe-all")
async def unsubscribe_all(
    current_user: dict = Depends(get_current_user)
):
    """Unsubscribe from all non-essential notifications."""
    user_id = current_user['user_id']
    
    # Keep only security and billing alerts
    prefs = {
        "email_notifications": False,
        "growth_milestone_alerts": False,
        "weekly_reports": False,
        "promotional_emails": False,
        "security_alerts": True,  # Keep for security
        "billing_alerts": True,   # Keep for billing
        "new_features": False,
        "tips_and_tricks": False,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"notification_preferences": prefs}}
    )
    
    return {
        "message": "Unsubscribed from all non-essential notifications",
        "preferences": prefs
    }
