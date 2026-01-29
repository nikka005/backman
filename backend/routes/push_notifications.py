"""
Push Notifications System for Adverlyx Digital.
Real-time notifications with WebSocket support and push capabilities.
"""
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import uuid
import asyncio
import json

from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/notifications", tags=["Notifications"])

db = None

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}  # user_id -> List[WebSocket]
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id] = [
                ws for ws in self.active_connections[user_id] if ws != websocket
            ]
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast(self, message: dict):
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, message)


manager = ConnectionManager()


def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# ==================== MODELS ====================

class NotificationType:
    SYSTEM = "system"
    PAYMENT = "payment"
    SUBSCRIPTION = "subscription"
    GROWTH = "growth"
    SUPPORT = "support"
    PROMOTION = "promotion"


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = NotificationType.SYSTEM
    action_url: Optional[str] = None
    icon: Optional[str] = None
    priority: str = "normal"  # low, normal, high


class BroadcastNotification(BaseModel):
    title: str
    message: str
    type: str = NotificationType.SYSTEM
    action_url: Optional[str] = None
    target: str = "all"  # all, subscribers, plan_name
    priority: str = "normal"


# ==================== USER NOTIFICATION ROUTES ====================

@router.get("/")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's notifications."""
    query = {"user_id": current_user["user_id"]}
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return notifications


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications."""
    count = await db.notifications.count_documents({
        "user_id": current_user["user_id"],
        "read": False
    })
    return {"count": count}


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["user_id"]},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Marked as read"}


@router.post("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    result = await db.notifications.update_many(
        {"user_id": current_user["user_id"], "read": False},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a notification."""
    result = await db.notifications.delete_one({
        "id": notification_id,
        "user_id": current_user["user_id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}


@router.delete("/")
async def clear_all_notifications(current_user: dict = Depends(get_current_user)):
    """Clear all notifications for user."""
    result = await db.notifications.delete_many({"user_id": current_user["user_id"]})
    return {"message": f"Deleted {result.deleted_count} notifications"}


# ==================== WEBSOCKET FOR REAL-TIME NOTIFICATIONS ====================

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications."""
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# ==================== ADMIN NOTIFICATION ROUTES ====================

@router.post("/admin/broadcast")
async def broadcast_notification(
    notification: BroadcastNotification,
    current_user: dict = Depends(admin_required)
):
    """Broadcast notification to users."""
    # Build target query
    if notification.target == "all":
        target_query = {"role": "user"}
    elif notification.target == "subscribers":
        # Get users with active subscriptions
        active_subs = await db.subscriptions.find(
            {"status": "active"},
            {"user_id": 1}
        ).to_list(10000)
        user_ids = [sub["user_id"] for sub in active_subs]
        target_query = {"id": {"$in": user_ids}}
    else:
        # Target specific plan
        subs = await db.subscriptions.find(
            {"plan": notification.target, "status": "active"},
            {"user_id": 1}
        ).to_list(10000)
        user_ids = [sub["user_id"] for sub in subs]
        target_query = {"id": {"$in": user_ids}}
    
    # Get target users
    users = await db.users.find(target_query, {"id": 1}).to_list(10000)
    
    # Create notifications
    notifications = []
    for user in users:
        notif = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "action_url": notification.action_url,
            "priority": notification.priority,
            "read": False,
            "broadcast": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.get("user_id")
        }
        notifications.append(notif)
        
        # Send real-time notification
        await manager.send_to_user(user["id"], {
            "type": "notification",
            "data": notif
        })
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    return {
        "message": f"Broadcast sent to {len(notifications)} users",
        "count": len(notifications)
    }


@router.post("/admin/send-to-user/{user_id}")
async def send_notification_to_user(
    user_id: str,
    notification: NotificationCreate,
    current_user: dict = Depends(admin_required)
):
    """Send notification to specific user."""
    # Verify user exists
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "action_url": notification.action_url,
        "icon": notification.icon,
        "priority": notification.priority,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user.get("user_id")
    }
    
    await db.notifications.insert_one(notif)
    
    # Send real-time notification
    await manager.send_to_user(user_id, {
        "type": "notification",
        "data": notif
    })
    
    return {"message": "Notification sent", "notification_id": notif["id"]}


@router.get("/admin/stats")
async def get_notification_stats(current_user: dict = Depends(admin_required)):
    """Get notification statistics."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    
    total_sent = await db.notifications.count_documents({})
    sent_today = await db.notifications.count_documents({
        "created_at": {"$gte": today_start.isoformat()}
    })
    sent_this_week = await db.notifications.count_documents({
        "created_at": {"$gte": week_start.isoformat()}
    })
    
    # Read rate
    total_read = await db.notifications.count_documents({"read": True})
    read_rate = (total_read / total_sent * 100) if total_sent > 0 else 0
    
    # By type
    by_type = await db.notifications.aggregate([
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    return {
        "total_sent": total_sent,
        "sent_today": sent_today,
        "sent_this_week": sent_this_week,
        "read_rate": round(read_rate, 2),
        "by_type": {item["_id"]: item["count"] for item in by_type}
    }


@router.get("/admin/recent")
async def get_recent_broadcasts(
    limit: int = 20,
    current_user: dict = Depends(admin_required)
):
    """Get recent broadcast notifications."""
    # Get unique broadcasts (one per batch)
    broadcasts = await db.notifications.aggregate([
        {"$match": {"broadcast": True}},
        {"$group": {
            "_id": {"title": "$title", "message": "$message", "created_at": "$created_at"},
            "count": {"$sum": 1},
            "created_by": {"$first": "$created_by"},
            "type": {"$first": "$type"}
        }},
        {"$sort": {"_id.created_at": -1}},
        {"$limit": limit}
    ]).to_list(limit)
    
    return broadcasts


# ==================== HELPER FUNCTIONS ====================

async def create_notification(
    user_id: str,
    title: str,
    message: str,
    notification_type: str = NotificationType.SYSTEM,
    action_url: str = None,
    priority: str = "normal"
):
    """Helper function to create and send a notification."""
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notification_type,
        "action_url": action_url,
        "priority": priority,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.notifications.insert_one(notif)
    
    # Send real-time notification
    await manager.send_to_user(user_id, {
        "type": "notification",
        "data": notif
    })
    
    return notif
