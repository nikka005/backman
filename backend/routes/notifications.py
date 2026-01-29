from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import List

from models.notification import Notification, NotificationCreate
from utils.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

db = None

def init_router(database):
    global db
    db = database


@router.get("/", response_model=List[Notification])
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's notifications."""
    query = {
        "$or": [
            {"user_id": current_user['user_id']},
            {"user_id": "all"}  # Broadcast notifications
        ]
    }
    
    if unread_only:
        query["read"] = False
    
    notifications = await db.notifications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return [Notification(**n) for n in notifications]


@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications."""
    count = await db.notifications.count_documents({
        "$or": [
            {"user_id": current_user['user_id']},
            {"user_id": "all"}
        ],
        "read": False
    })
    
    return {"unread_count": count}


@router.post("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a notification as read."""
    result = await db.notifications.update_one(
        {
            "id": notification_id,
            "$or": [
                {"user_id": current_user['user_id']},
                {"user_id": "all"}
            ]
        },
        {"$set": {
            "read": True,
            "read_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_as_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read."""
    await db.notifications.update_many(
        {
            "$or": [
                {"user_id": current_user['user_id']},
                {"user_id": "all"}
            ],
            "read": False
        },
        {"$set": {
            "read": True,
            "read_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "All notifications marked as read"}
