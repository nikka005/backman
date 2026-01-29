"""
API Rate Limit Dashboard for Adverlyx Digital.
Shows rate limiting statistics and allows configuration.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
import time

from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/admin/rate-limits", tags=["Rate Limits"])

db = None

def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# In-memory rate limit storage (in production, use Redis)
rate_limit_data = {}
blocked_ips = {}


# ==================== MODELS ====================

class RateLimitConfig(BaseModel):
    endpoint_key: str  # e.g., "auth_login", "payment", "api_general"
    max_requests: int
    window_seconds: int
    block_duration_seconds: int = 300  # 5 minutes default
    enabled: bool = True


class RateLimitStats(BaseModel):
    endpoint_key: str
    total_requests: int = 0
    blocked_requests: int = 0
    unique_ips: int = 0
    current_blocked_ips: int = 0


# Default rate limit configurations
DEFAULT_RATE_LIMITS = {
    "auth_login": {"max_requests": 5, "window_seconds": 60, "block_duration_seconds": 300},
    "auth_register": {"max_requests": 3, "window_seconds": 300, "block_duration_seconds": 600},
    "password_reset": {"max_requests": 3, "window_seconds": 300, "block_duration_seconds": 600},
    "payment": {"max_requests": 10, "window_seconds": 60, "block_duration_seconds": 300},
    "api_general": {"max_requests": 100, "window_seconds": 60, "block_duration_seconds": 120},
    "instagram_connect": {"max_requests": 5, "window_seconds": 300, "block_duration_seconds": 600},
    "ticket_create": {"max_requests": 10, "window_seconds": 300, "block_duration_seconds": 300},
}


# ==================== ROUTES ====================

@router.get("/config")
async def get_rate_limit_config(current_user: dict = Depends(admin_required)):
    """Get all rate limit configurations."""
    configs = await db.rate_limit_configs.find({}, {"_id": 0}).to_list(50)
    
    # If no configs in DB, return defaults
    if not configs:
        return [
            {"endpoint_key": k, **v, "enabled": True}
            for k, v in DEFAULT_RATE_LIMITS.items()
        ]
    
    return configs


@router.put("/config/{endpoint_key}")
async def update_rate_limit_config(
    endpoint_key: str,
    config: RateLimitConfig,
    current_user: dict = Depends(admin_required)
):
    """Update rate limit configuration for an endpoint."""
    config_dict = config.model_dump()
    config_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    config_dict["updated_by"] = current_user.get("user_id")
    
    await db.rate_limit_configs.update_one(
        {"endpoint_key": endpoint_key},
        {"$set": config_dict},
        upsert=True
    )
    
    return {"message": f"Rate limit config updated for {endpoint_key}"}


@router.post("/config/reset-defaults")
async def reset_to_defaults(current_user: dict = Depends(admin_required)):
    """Reset all rate limits to default values."""
    for key, config in DEFAULT_RATE_LIMITS.items():
        await db.rate_limit_configs.update_one(
            {"endpoint_key": key},
            {"$set": {
                "endpoint_key": key,
                **config,
                "enabled": True,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
    
    return {"message": "Reset to default configurations"}


@router.get("/stats")
async def get_rate_limit_stats(current_user: dict = Depends(admin_required)):
    """Get rate limiting statistics."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    hour_ago = now - timedelta(hours=1)
    
    # Get stats from rate limit logs
    total_requests = await db.rate_limit_logs.count_documents({})
    requests_today = await db.rate_limit_logs.count_documents({
        "timestamp": {"$gte": today_start.isoformat()}
    })
    requests_last_hour = await db.rate_limit_logs.count_documents({
        "timestamp": {"$gte": hour_ago.isoformat()}
    })
    
    blocked_today = await db.rate_limit_logs.count_documents({
        "timestamp": {"$gte": today_start.isoformat()},
        "blocked": True
    })
    
    # By endpoint
    by_endpoint = await db.rate_limit_logs.aggregate([
        {"$match": {"timestamp": {"$gte": today_start.isoformat()}}},
        {"$group": {
            "_id": "$endpoint_key",
            "total": {"$sum": 1},
            "blocked": {"$sum": {"$cond": ["$blocked", 1, 0]}}
        }},
        {"$sort": {"total": -1}}
    ]).to_list(20)
    
    # Top blocked IPs
    top_blocked_ips = await db.rate_limit_logs.aggregate([
        {"$match": {"blocked": True, "timestamp": {"$gte": today_start.isoformat()}}},
        {"$group": {"_id": "$ip_address", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]).to_list(10)
    
    # Currently blocked IPs count
    current_blocked = await db.blocked_ips.count_documents({
        "blocked_until": {"$gt": now.isoformat()}
    })
    
    return {
        "total_requests": total_requests,
        "requests_today": requests_today,
        "requests_last_hour": requests_last_hour,
        "blocked_today": blocked_today,
        "block_rate": round((blocked_today / requests_today * 100) if requests_today > 0 else 0, 2),
        "currently_blocked_ips": current_blocked,
        "by_endpoint": [
            {"endpoint": item["_id"], "total": item["total"], "blocked": item["blocked"]}
            for item in by_endpoint
        ],
        "top_blocked_ips": [
            {"ip": item["_id"], "count": item["count"]}
            for item in top_blocked_ips
        ]
    }


@router.get("/blocked-ips")
async def get_blocked_ips(current_user: dict = Depends(admin_required)):
    """Get list of currently blocked IPs."""
    now = datetime.now(timezone.utc)
    
    blocked = await db.blocked_ips.find(
        {"blocked_until": {"$gt": now.isoformat()}},
        {"_id": 0}
    ).sort("blocked_until", -1).to_list(100)
    
    return blocked


@router.post("/unblock-ip/{ip_address}")
async def unblock_ip(ip_address: str, current_user: dict = Depends(admin_required)):
    """Manually unblock an IP address."""
    result = await db.blocked_ips.delete_one({"ip_address": ip_address})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="IP not found in blocked list")
    
    # Log the action
    await db.admin_logs.insert_one({
        "action": "unblock_ip",
        "ip_address": ip_address,
        "admin_id": current_user.get("user_id"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": f"IP {ip_address} unblocked"}


@router.post("/block-ip")
async def block_ip_manually(
    ip_address: str,
    duration_hours: int = 24,
    reason: str = "Manual block",
    current_user: dict = Depends(admin_required)
):
    """Manually block an IP address."""
    now = datetime.now(timezone.utc)
    blocked_until = now + timedelta(hours=duration_hours)
    
    await db.blocked_ips.update_one(
        {"ip_address": ip_address},
        {"$set": {
            "ip_address": ip_address,
            "blocked_until": blocked_until.isoformat(),
            "reason": reason,
            "blocked_by": current_user.get("user_id"),
            "manual_block": True,
            "created_at": now.isoformat()
        }},
        upsert=True
    )
    
    return {"message": f"IP {ip_address} blocked for {duration_hours} hours"}


@router.get("/live-requests")
async def get_live_requests(
    limit: int = 50,
    current_user: dict = Depends(admin_required)
):
    """Get recent API requests for live monitoring."""
    requests = await db.rate_limit_logs.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    return requests


@router.get("/endpoint-details/{endpoint_key}")
async def get_endpoint_details(
    endpoint_key: str,
    current_user: dict = Depends(admin_required)
):
    """Get detailed stats for a specific endpoint."""
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(days=1)
    
    # Get config
    config = await db.rate_limit_configs.find_one(
        {"endpoint_key": endpoint_key},
        {"_id": 0}
    )
    
    if not config:
        config = DEFAULT_RATE_LIMITS.get(endpoint_key, {})
        config["endpoint_key"] = endpoint_key
    
    # Get stats
    total_requests = await db.rate_limit_logs.count_documents({
        "endpoint_key": endpoint_key,
        "timestamp": {"$gte": day_ago.isoformat()}
    })
    
    blocked_requests = await db.rate_limit_logs.count_documents({
        "endpoint_key": endpoint_key,
        "timestamp": {"$gte": day_ago.isoformat()},
        "blocked": True
    })
    
    # Hourly breakdown
    hourly = await db.rate_limit_logs.aggregate([
        {"$match": {
            "endpoint_key": endpoint_key,
            "timestamp": {"$gte": day_ago.isoformat()}
        }},
        {"$addFields": {
            "hour": {"$substr": ["$timestamp", 11, 2]}
        }},
        {"$group": {
            "_id": "$hour",
            "total": {"$sum": 1},
            "blocked": {"$sum": {"$cond": ["$blocked", 1, 0]}}
        }},
        {"$sort": {"_id": 1}}
    ]).to_list(24)
    
    return {
        "config": config,
        "stats_24h": {
            "total_requests": total_requests,
            "blocked_requests": blocked_requests,
            "block_rate": round((blocked_requests / total_requests * 100) if total_requests > 0 else 0, 2)
        },
        "hourly_breakdown": hourly
    }


# ==================== RATE LIMIT LOGGING HELPER ====================

async def log_rate_limit_request(
    ip_address: str,
    endpoint_key: str,
    blocked: bool = False,
    user_id: str = None
):
    """Log a rate-limited request."""
    log_entry = {
        "ip_address": ip_address,
        "endpoint_key": endpoint_key,
        "blocked": blocked,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.rate_limit_logs.insert_one(log_entry)
