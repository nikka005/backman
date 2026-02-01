"""
Enhanced Admin Analytics API
Provides detailed charts and traffic data
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging
import random

from utils.auth import get_current_user
from models.user import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/charts", tags=["Admin Charts"])

db = None

def init_router(database):
    global db
    db = database


# ============== Helper Functions ==============

async def get_daily_stats(days: int = 30) -> list:
    """Get daily statistics for charts."""
    now = datetime.now(timezone.utc)
    stats = []
    
    for i in range(days - 1, -1, -1):
        date = now - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Get real data from database
        new_users = await db.users.count_documents({
            "created_at": {"$gte": date_start.isoformat(), "$lte": date_end.isoformat()}
        })
        
        new_subs = await db.subscriptions.count_documents({
            "created_at": {"$gte": date_start.isoformat(), "$lte": date_end.isoformat()}
        })
        
        # Calculate revenue from payments
        payments = await db.payments.find({
            "created_at": {"$gte": date_start.isoformat(), "$lte": date_end.isoformat()},
            "status": {"$in": ["success", "paid"]}
        }, {"amount": 1, "_id": 0}).to_list(1000)
        
        revenue = sum(p.get("amount", 0) for p in payments)
        
        # Simulate page views (in production, use real analytics)
        base_views = 100 + (i * 5)  # Growing trend
        page_views = base_views + random.randint(-20, 50)
        
        stats.append({
            "date": date_str,
            "display_date": date.strftime("%b %d"),
            "new_users": new_users,
            "new_subscriptions": new_subs,
            "revenue": revenue,
            "page_views": max(0, page_views),
            "unique_visitors": int(page_views * 0.7),
            "bounce_rate": round(30 + random.uniform(-5, 10), 1),
            "avg_session": round(2.5 + random.uniform(-0.5, 1), 2)
        })
    
    return stats


# ============== API Endpoints ==============

@router.get("/revenue")
async def get_revenue_chart_data(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get revenue data for chart."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    daily_stats = await get_daily_stats(days)
    
    total_revenue = sum(d["revenue"] for d in daily_stats)
    avg_daily = total_revenue / days if days > 0 else 0
    
    # Calculate growth
    if days >= 14:
        first_half = sum(d["revenue"] for d in daily_stats[:days//2])
        second_half = sum(d["revenue"] for d in daily_stats[days//2:])
        growth = ((second_half - first_half) / first_half * 100) if first_half > 0 else 0
    else:
        growth = 0
    
    return {
        "chart_data": [{"date": d["display_date"], "revenue": d["revenue"]} for d in daily_stats],
        "summary": {
            "total": total_revenue,
            "average_daily": round(avg_daily, 2),
            "growth_percent": round(growth, 1),
            "period_days": days
        }
    }


@router.get("/users")
async def get_users_chart_data(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get user growth data for chart."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    daily_stats = await get_daily_stats(days)
    
    total_new = sum(d["new_users"] for d in daily_stats)
    total_users = await db.users.count_documents({})
    
    # Cumulative growth
    cumulative = 0
    chart_data = []
    for d in daily_stats:
        cumulative += d["new_users"]
        chart_data.append({
            "date": d["display_date"],
            "new_users": d["new_users"],
            "cumulative": cumulative
        })
    
    return {
        "chart_data": chart_data,
        "summary": {
            "total_users": total_users,
            "new_users_period": total_new,
            "average_daily": round(total_new / days, 1) if days > 0 else 0,
            "period_days": days
        }
    }


@router.get("/subscriptions")
async def get_subscriptions_chart_data(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get subscription data for chart."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    daily_stats = await get_daily_stats(days)
    
    # Plan distribution
    plan_counts = {}
    subs = await db.subscriptions.find(
        {"status": "active"},
        {"plan": 1, "_id": 0}
    ).to_list(10000)
    
    for sub in subs:
        plan = sub.get("plan", "basic")
        plan_counts[plan] = plan_counts.get(plan, 0) + 1
    
    return {
        "chart_data": [{"date": d["display_date"], "subscriptions": d["new_subscriptions"]} for d in daily_stats],
        "plan_distribution": plan_counts,
        "summary": {
            "total_active": len(subs),
            "new_period": sum(d["new_subscriptions"] for d in daily_stats),
            "period_days": days
        }
    }


@router.get("/traffic")
async def get_traffic_chart_data(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get website traffic data for chart."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    daily_stats = await get_daily_stats(days)
    
    total_views = sum(d["page_views"] for d in daily_stats)
    total_visitors = sum(d["unique_visitors"] for d in daily_stats)
    avg_bounce = sum(d["bounce_rate"] for d in daily_stats) / len(daily_stats) if daily_stats else 0
    avg_session = sum(d["avg_session"] for d in daily_stats) / len(daily_stats) if daily_stats else 0
    
    return {
        "chart_data": [
            {
                "date": d["display_date"],
                "page_views": d["page_views"],
                "unique_visitors": d["unique_visitors"]
            } for d in daily_stats
        ],
        "summary": {
            "total_page_views": total_views,
            "total_unique_visitors": total_visitors,
            "average_bounce_rate": round(avg_bounce, 1),
            "average_session_duration": round(avg_session, 2),
            "period_days": days
        }
    }


@router.get("/traffic-sources")
async def get_traffic_sources(current_user: dict = Depends(get_current_user)):
    """Get traffic source distribution."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Simulated traffic sources (in production, integrate with analytics)
    sources = {
        "organic_search": {"value": 42, "label": "Organic Search", "color": "#10b981"},
        "direct": {"value": 25, "label": "Direct", "color": "#3b82f6"},
        "social": {"value": 18, "label": "Social Media", "color": "#ec4899"},
        "referral": {"value": 10, "label": "Referral", "color": "#f59e0b"},
        "paid": {"value": 5, "label": "Paid Ads", "color": "#8b5cf6"}
    }
    
    return {"sources": sources}


@router.get("/top-pages")
async def get_top_pages(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get top visited pages."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Simulated page data (in production, use real analytics)
    pages = [
        {"path": "/", "title": "Home", "views": 15420, "unique": 12350, "bounce_rate": 28.5},
        {"path": "/pricing", "title": "Pricing", "views": 8540, "unique": 7120, "bounce_rate": 22.3},
        {"path": "/login", "title": "Login", "views": 6230, "unique": 5840, "bounce_rate": 15.2},
        {"path": "/signup", "title": "Sign Up", "views": 4150, "unique": 3920, "bounce_rate": 18.7},
        {"path": "/dashboard", "title": "Dashboard", "views": 3890, "unique": 2150, "bounce_rate": 12.4},
        {"path": "/checkout", "title": "Checkout", "views": 2340, "unique": 2180, "bounce_rate": 35.8},
        {"path": "/features", "title": "Features", "views": 1890, "unique": 1650, "bounce_rate": 42.1},
        {"path": "/about", "title": "About Us", "views": 1420, "unique": 1280, "bounce_rate": 55.3},
        {"path": "/contact", "title": "Contact", "views": 980, "unique": 890, "bounce_rate": 48.2},
        {"path": "/blog", "title": "Blog", "views": 750, "unique": 620, "bounce_rate": 38.5}
    ]
    
    return {"pages": pages[:limit]}


@router.get("/conversion-funnel")
async def get_conversion_funnel_chart(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get conversion funnel data for chart."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    
    # Get real funnel data
    visitors = 10000  # Simulated
    signups = await db.users.count_documents({
        "created_at": {"$gte": start_date.isoformat()}
    })
    
    trials = await db.subscriptions.count_documents({
        "created_at": {"$gte": start_date.isoformat()},
        "status": {"$in": ["trial", "active"]}
    })
    
    paid = await db.payments.count_documents({
        "created_at": {"$gte": start_date.isoformat()},
        "status": {"$in": ["success", "paid"]}
    })
    
    funnel = [
        {"stage": "Visitors", "count": visitors, "percentage": 100},
        {"stage": "Sign Ups", "count": signups, "percentage": round((signups / visitors) * 100, 1) if visitors > 0 else 0},
        {"stage": "Trials", "count": trials, "percentage": round((trials / visitors) * 100, 1) if visitors > 0 else 0},
        {"stage": "Paid", "count": paid, "percentage": round((paid / visitors) * 100, 1) if visitors > 0 else 0}
    ]
    
    return {
        "funnel": funnel,
        "conversion_rates": {
            "visitor_to_signup": round((signups / visitors) * 100, 2) if visitors > 0 else 0,
            "signup_to_trial": round((trials / signups) * 100, 2) if signups > 0 else 0,
            "trial_to_paid": round((paid / trials) * 100, 2) if trials > 0 else 0,
            "overall": round((paid / visitors) * 100, 2) if visitors > 0 else 0
        }
    }


@router.get("/geographic")
async def get_geographic_chart_data(current_user: dict = Depends(get_current_user)):
    """Get geographic distribution data."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get from targeting settings
    countries = {}
    
    targeting = await db.targeting_settings.find(
        {},
        {"_id": 0, "locations": 1}
    ).to_list(1000)
    
    for t in targeting:
        for loc in t.get("locations", []):
            country = loc.get("country", loc) if isinstance(loc, dict) else loc
            countries[country] = countries.get(country, 0) + 1
    
    # Add some defaults if empty
    if not countries:
        countries = {
            "United States": 45,
            "India": 20,
            "United Kingdom": 12,
            "Germany": 8,
            "Canada": 6,
            "Australia": 5,
            "France": 4
        }
    
    # Sort by count
    sorted_countries = sorted(countries.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "countries": [{"name": k, "users": v} for k, v in sorted_countries[:10]],
        "total_countries": len(countries)
    }


@router.get("/realtime")
async def get_realtime_stats(current_user: dict = Depends(get_current_user)):
    """Get real-time statistics."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    one_hour_ago = now - timedelta(hours=1)
    five_min_ago = now - timedelta(minutes=5)
    
    # Active users (users with recent activity)
    recent_users = await db.users.count_documents({
        "last_login": {"$gte": one_hour_ago.isoformat()}
    })
    
    # Recent signups
    recent_signups = await db.users.count_documents({
        "created_at": {"$gte": one_hour_ago.isoformat()}
    })
    
    # Recent payments
    recent_payments = await db.payments.find({
        "created_at": {"$gte": one_hour_ago.isoformat()},
        "status": {"$in": ["success", "paid"]}
    }, {"amount": 1, "_id": 0}).to_list(100)
    
    recent_revenue = sum(p.get("amount", 0) for p in recent_payments)
    
    return {
        "active_users": recent_users,
        "recent_signups": recent_signups,
        "recent_revenue": recent_revenue,
        "page_views_last_hour": random.randint(50, 200),  # Simulated
        "current_visitors": random.randint(10, 50),  # Simulated
        "timestamp": now.isoformat()
    }


@router.get("/dashboard-summary")
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    """Get comprehensive dashboard summary."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)
    
    # Total counts
    total_users = await db.users.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    
    # This month
    new_users_month = await db.users.count_documents({
        "created_at": {"$gte": thirty_days_ago.isoformat()}
    })
    
    # This week
    new_users_week = await db.users.count_documents({
        "created_at": {"$gte": seven_days_ago.isoformat()}
    })
    
    # Revenue
    payments_month = await db.payments.find({
        "created_at": {"$gte": thirty_days_ago.isoformat()},
        "status": {"$in": ["success", "paid"]}
    }, {"amount": 1, "_id": 0}).to_list(10000)
    
    mrr = sum(p.get("amount", 0) for p in payments_month)
    
    # Open tickets
    open_tickets = await db.tickets.count_documents({"status": "open"})
    
    # Chart data
    daily_stats = await get_daily_stats(30)
    
    return {
        "summary": {
            "total_users": total_users,
            "active_subscriptions": active_subs,
            "new_users_month": new_users_month,
            "new_users_week": new_users_week,
            "mrr": mrr,
            "arr": mrr * 12,
            "open_tickets": open_tickets
        },
        "revenue_chart": [{"date": d["display_date"], "revenue": d["revenue"]} for d in daily_stats],
        "users_chart": [{"date": d["display_date"], "users": d["new_users"]} for d in daily_stats],
        "traffic_chart": [{"date": d["display_date"], "views": d["page_views"]} for d in daily_stats]
    }
