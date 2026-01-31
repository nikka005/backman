from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel

from models.analytics import (
    UserAnalytics, PlatformAnalytics, GrowthEngineAnalytics, 
    FunnelAnalytics, FunnelEvent, AnalyticsPeriod
)
from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])

db = None

def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# ==================== PLATFORM ANALYTICS ====================

@router.get("/platform")
async def get_platform_analytics(
    period: AnalyticsPeriod = AnalyticsPeriod.MONTHLY,
    current_user: dict = Depends(admin_required)
):
    """Get platform-wide analytics."""
    now = datetime.now(timezone.utc)
    
    # Calculate date ranges
    if period == AnalyticsPeriod.DAILY:
        start_date = now - timedelta(days=1)
    elif period == AnalyticsPeriod.WEEKLY:
        start_date = now - timedelta(weeks=1)
    elif period == AnalyticsPeriod.MONTHLY:
        start_date = now - timedelta(days=30)
    elif period == AnalyticsPeriod.YEARLY:
        start_date = now - timedelta(days=365)
    else:
        start_date = None
    
    # Calculate metrics
    total_users = await db.users.count_documents({"role": "user"})
    active_users = await db.users.count_documents({"role": "user", "status": "active"})
    
    # New users in period
    new_users_query = {"role": "user"}
    if start_date:
        new_users_query["created_at"] = {"$gte": start_date.isoformat()}
    new_users = await db.users.count_documents(new_users_query)
    
    # Subscription metrics
    total_subs = await db.subscriptions.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    
    # Revenue calculation
    revenue_query = {"status": "success"}
    if start_date:
        revenue_query["created_at"] = {"$gte": start_date.isoformat()}
    payments = await db.payments.find(revenue_query).to_list(10000)
    total_revenue = sum(p.get('amount', 0) for p in payments)
    
    # MRR from active subs
    active_sub_docs = await db.subscriptions.find({"status": "active"}).to_list(1000)
    mrr = sum(s.get('price', 0) for s in active_sub_docs if s.get('billing_cycle') == 'monthly')
    mrr += sum(s.get('price', 0) / 12 for s in active_sub_docs if s.get('billing_cycle') == 'yearly')
    
    # Churn
    cancelled_query = {"status": "cancelled"}
    if start_date:
        cancelled_query["cancelled_at"] = {"$gte": start_date.isoformat()}
    cancelled = await db.subscriptions.count_documents(cancelled_query)
    churn_rate = (cancelled / max(active_subs, 1)) * 100
    
    # ARPU
    arpu = total_revenue / max(total_users, 1)
    arppu = total_revenue / max(active_subs, 1)
    
    # Plan distribution
    plan_dist = {}
    for plan in ['basic', 'pro', 'enterprise']:
        count = await db.subscriptions.count_documents({"plan": plan, "status": "active"})
        plan_dist[plan] = count
    
    return {
        "period": period,
        "calculated_at": now.isoformat(),
        "revenue": {
            "mrr": round(mrr, 2),
            "arr": round(mrr * 12, 2),
            "total_revenue": round(total_revenue, 2),
            "arpu": round(arpu, 2),
            "arppu": round(arppu, 2)
        },
        "users": {
            "total": total_users,
            "active": active_users,
            "new": new_users,
            "churned": cancelled
        },
        "subscriptions": {
            "total": total_subs,
            "active": active_subs,
            "cancelled": cancelled,
            "churn_rate": round(churn_rate, 2)
        },
        "plan_distribution": plan_dist
    }


@router.get("/platform/trends")
async def get_platform_trends(
    days: int = 30,
    current_user: dict = Depends(admin_required)
):
    """Get daily trends for the platform."""
    now = datetime.now(timezone.utc)
    trends = []
    
    for i in range(days):
        date = now - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        
        # Count new users for that day
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        new_users = await db.users.count_documents({
            "role": "user",
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        new_subs = await db.subscriptions.count_documents({
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        # Revenue for that day
        payments = await db.payments.find({
            "status": "success",
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        }).to_list(1000)
        revenue = sum(p.get('amount', 0) for p in payments)
        
        trends.append({
            "date": date_str,
            "new_users": new_users,
            "new_subscriptions": new_subs,
            "revenue": round(revenue, 2)
        })
    
    return {"trends": list(reversed(trends))}


# ==================== USER ANALYTICS ====================

@router.get("/users")
async def get_users_analytics(current_user: dict = Depends(admin_required)):
    """Get analytics for all users."""
    # Get users with their stats
    users = await db.users.find({"role": "user"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    analytics = []
    for user in users:
        # Get subscription
        sub = await db.subscriptions.find_one({"user_id": user['id'], "status": "active"})
        
        # Get Instagram account
        ig = await db.instagram_accounts.find_one({"user_id": user['id']})
        
        # Get payments total
        payments = await db.payments.find({"user_id": user['id'], "status": "success"}).to_list(100)
        total_spent = sum(p.get('amount', 0) for p in payments)
        
        analytics.append({
            "user_id": user['id'],
            "email": user['email'],
            "name": user['name'],
            "status": user.get('status', 'active'),
            "plan": sub['plan'] if sub else None,
            "instagram_username": ig['username'] if ig else None,
            "followers_gained": ig.get('total_followers_gained', 0) if ig else 0,
            "total_spent": round(total_spent, 2),
            "created_at": user['created_at'],
            "last_login": user.get('last_login')
        })
    
    return {"users": analytics}


@router.get("/users/{user_id}")
async def get_user_analytics(user_id: str, current_user: dict = Depends(admin_required)):
    """Get detailed analytics for a specific user."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all related data
    subscriptions = await db.subscriptions.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    payments = await db.payments.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    ig = await db.instagram_accounts.find_one({"user_id": user_id}, {"_id": 0})
    targeting = await db.targeting_settings.find_one({"user_id": user_id}, {"_id": 0})
    growth_logs = await db.growth_logs.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    tickets = await db.tickets.find({"user_id": user_id}, {"_id": 0}).to_list(10)
    
    # Calculate LTV
    total_spent = sum(p.get('amount', 0) for p in payments if p.get('status') == 'success')
    
    # Activity
    login_count = user.get('login_count', 0)
    
    return {
        "user": user,
        "subscriptions": subscriptions,
        "payments": payments,
        "instagram_account": ig,
        "targeting": targeting,
        "growth_logs": growth_logs,
        "tickets": tickets,
        "summary": {
            "total_spent": round(total_spent, 2),
            "login_count": login_count,
            "followers_gained": ig.get('total_followers_gained', 0) if ig else 0,
            "current_plan": subscriptions[0]['plan'] if subscriptions else None,
            "ticket_count": len(tickets)
        }
    }


# ==================== GROWTH ENGINE ANALYTICS ====================

@router.get("/growth-engine")
async def get_growth_engine_analytics(current_user: dict = Depends(admin_required)):
    """Get growth engine performance analytics."""
    # Get all active Instagram accounts
    accounts = await db.instagram_accounts.find({"status": "active"}).to_list(10000)
    
    total_accounts = len(accounts)
    total_followers_gained = sum(a.get('total_followers_gained', 0) for a in accounts)
    avg_followers_gained = total_followers_gained / max(total_accounts, 1)
    
    # Get targeting settings to analyze niches
    targeting = await db.targeting_settings.find({}).to_list(10000)
    niche_counts = {}
    for t in targeting:
        niche = t.get('niche', 'Unknown')
        if niche:
            niche_counts[niche] = niche_counts.get(niche, 0) + 1
    
    # Get growth logs for analysis
    logs = await db.growth_logs.find({"log_type": "follower_gained"}).to_list(10000)
    
    return {
        "summary": {
            "total_accounts_served": total_accounts,
            "total_followers_delivered": total_followers_gained,
            "average_followers_per_account": round(avg_followers_gained, 2)
        },
        "niche_distribution": niche_counts,
        "log_count": len(logs)
    }


# ==================== FUNNEL ANALYTICS ====================

@router.post("/events")
async def track_event(event: dict):
    """Track a funnel event (public endpoint for frontend tracking)."""
    import uuid
    event['id'] = str(uuid.uuid4())
    event['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.funnel_events.insert_one(event)
    return {"status": "tracked"}


@router.get("/funnel")
async def get_funnel_analytics(
    days: int = 30,
    current_user: dict = Depends(admin_required)
):
    """Get funnel analytics."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    
    # Get events in period
    events = await db.funnel_events.find({
        "created_at": {"$gte": start_date.isoformat()}
    }).to_list(100000)
    
    # Aggregate
    page_views = {}
    cta_clicks = {}
    
    for event in events:
        if event.get('event_type') == 'page_view':
            page = event.get('page', 'unknown')
            page_views[page] = page_views.get(page, 0) + 1
        elif event.get('event_type') == 'click':
            cta = event.get('event_name', 'unknown')
            cta_clicks[cta] = cta_clicks.get(cta, 0) + 1
    
    return {
        "period_days": days,
        "total_events": len(events),
        "page_views": page_views,
        "cta_clicks": cta_clicks
    }


@router.get("/geography")
async def get_geography_analytics(current_user: dict = Depends(admin_required)):
    """Get geographic distribution of users."""
    # Get targeting settings for location data
    targeting = await db.targeting_settings.find({}, {"_id": 0}).to_list(10000)
    
    country_counts = {}
    for t in targeting:
        locations = t.get('locations', [])
        for loc in locations:
            country = loc.get('country', loc) if isinstance(loc, dict) else loc
            if country:
                country_counts[country] = country_counts.get(country, 0) + 1
    
    # Sort by count
    sorted_countries = sorted(country_counts.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "country_distribution": dict(sorted_countries[:20]),  # Top 20 countries
        "total_locations": sum(country_counts.values())
    }


@router.get("/conversion-funnel")
async def get_conversion_funnel(
    days: int = 30,
    current_user: dict = Depends(admin_required)
):
    """Get conversion funnel metrics."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    
    # Visitors (unique page views on homepage)
    visitors = await db.funnel_events.count_documents({
        "event_type": "page_view",
        "page": "homepage",
        "created_at": {"$gte": start_date.isoformat()}
    })
    
    # Signups
    signups = await db.users.count_documents({
        "role": "user",
        "created_at": {"$gte": start_date.isoformat()}
    })
    
    # Trials / Free users
    free_users = await db.users.count_documents({
        "role": "user",
        "status": "active",
        "current_plan": None,
        "created_at": {"$gte": start_date.isoformat()}
    })
    
    # Paid conversions
    paid_subs = await db.subscriptions.count_documents({
        "status": "active",
        "created_at": {"$gte": start_date.isoformat()}
    })
    
    return {
        "period_days": days,
        "funnel": [
            {"stage": "Visitors", "count": visitors or 1000, "icon": "eye"},
            {"stage": "Signups", "count": signups, "icon": "user-plus"},
            {"stage": "Free Trial", "count": free_users or signups, "icon": "gift"},
            {"stage": "Paid", "count": paid_subs, "icon": "credit-card"}
        ],
        "conversion_rates": {
            "visitor_to_signup": round((signups / max(visitors, 1)) * 100, 2),
            "signup_to_trial": round((free_users / max(signups, 1)) * 100, 2) if signups else 0,
            "trial_to_paid": round((paid_subs / max(free_users or signups, 1)) * 100, 2)
        }
    }



# ==================== INSTAGRAM USER DATA ====================

@router.get("/instagram-users")
async def get_instagram_users_analytics(current_user: dict = Depends(admin_required)):
    """
    Get comprehensive Instagram analytics for all connected users.
    Shows real data from OAuth connected accounts.
    """
    # Get all Instagram accounts with user info
    accounts = await db.instagram_accounts.find(
        {"status": {"$ne": "disconnected"}},
        {"_id": 0, "access_token": 0}  # Don't expose access tokens
    ).to_list(10000)
    
    # Get user info for each account
    instagram_users = []
    total_followers = 0
    total_gained = 0
    oauth_connected_count = 0
    manual_connected_count = 0
    
    for account in accounts:
        user = await db.users.find_one(
            {"id": account.get("user_id")},
            {"_id": 0, "password_hash": 0}
        )
        
        # Get subscription info
        subscription = await db.subscriptions.find_one(
            {"user_id": account.get("user_id"), "status": "active"},
            {"_id": 0}
        )
        
        # Get targeting info
        targeting = await db.targeting_settings.find_one(
            {"user_id": account.get("user_id")},
            {"_id": 0}
        )
        
        followers = account.get("followers_count", 0)
        gained = account.get("total_followers_gained", 0)
        
        total_followers += followers
        total_gained += gained
        
        is_oauth = account.get("oauth_connected", False)
        if is_oauth:
            oauth_connected_count += 1
        else:
            manual_connected_count += 1
        
        instagram_users.append({
            "user_id": account.get("user_id"),
            "user_email": user.get("email") if user else "Unknown",
            "user_name": user.get("name") if user else "Unknown",
            "instagram_username": account.get("username"),
            "instagram_name": account.get("name", ""),
            "profile_picture_url": account.get("profile_picture_url", ""),
            "account_type": account.get("account_type", "personal"),
            "oauth_connected": is_oauth,
            "followers_count": followers,
            "following_count": account.get("following_count", 0),
            "posts_count": account.get("posts_count", 0),
            "engagement_rate": account.get("engagement_rate", 0),
            "initial_followers": account.get("initial_followers", 0),
            "total_followers_gained": gained,
            "followers_today": account.get("followers_gained_today", 0),
            "followers_this_week": account.get("followers_gained_this_week", 0),
            "followers_this_month": account.get("followers_gained_this_month", 0),
            "growth_paused": account.get("growth_paused", False),
            "status": account.get("status", "active"),
            "niche": targeting.get("niche") if targeting else None,
            "subscription_plan": subscription.get("plan") if subscription else "Free",
            "last_refreshed": account.get("last_refreshed"),
            "connected_at": account.get("connected_at") or account.get("created_at"),
        })
    
    # Sort by followers count
    instagram_users.sort(key=lambda x: x["followers_count"], reverse=True)
    
    return {
        "summary": {
            "total_instagram_accounts": len(accounts),
            "oauth_connected": oauth_connected_count,
            "manual_connected": manual_connected_count,
            "total_followers_across_all": total_followers,
            "total_followers_delivered": total_gained,
            "average_followers_per_account": round(total_followers / max(len(accounts), 1), 2),
            "average_gained_per_account": round(total_gained / max(len(accounts), 1), 2)
        },
        "users": instagram_users
    }


@router.get("/instagram-users/{user_id}")
async def get_instagram_user_detail(
    user_id: str,
    current_user: dict = Depends(admin_required)
):
    """
    Get detailed Instagram analytics for a specific user.
    """
    # Get Instagram account
    account = await db.instagram_accounts.find_one(
        {"user_id": user_id},
        {"_id": 0, "access_token": 0}
    )
    
    if not account:
        raise HTTPException(status_code=404, detail="Instagram account not found")
    
    # Get user info
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    # Get subscription
    subscription = await db.subscriptions.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    # Get targeting
    targeting = await db.targeting_settings.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    # Get growth logs
    growth_logs = await db.growth_logs.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    
    # Get AI analysis if available
    ai_analysis = user.get("ai_analysis") if user else None
    
    # Calculate growth rate
    days_active = 1
    if account.get("connected_at"):
        try:
            connected = datetime.fromisoformat(account["connected_at"].replace('Z', '+00:00'))
            days_active = max(1, (datetime.now(timezone.utc) - connected).days)
        except (ValueError, AttributeError):
            pass
    
    total_gained = account.get("total_followers_gained", 0)
    daily_avg = round(total_gained / days_active, 2)
    
    return {
        "user": user,
        "instagram_account": {
            "username": account.get("username"),
            "name": account.get("name", ""),
            "profile_picture_url": account.get("profile_picture_url", ""),
            "account_type": account.get("account_type"),
            "oauth_connected": account.get("oauth_connected", False),
            "followers_count": account.get("followers_count", 0),
            "following_count": account.get("following_count", 0),
            "posts_count": account.get("posts_count", 0),
            "engagement_rate": account.get("engagement_rate", 0),
            "initial_followers": account.get("initial_followers", 0),
            "total_followers_gained": total_gained,
            "followers_today": account.get("followers_gained_today", 0),
            "followers_this_week": account.get("followers_gained_this_week", 0),
            "followers_this_month": account.get("followers_gained_this_month", 0),
            "growth_paused": account.get("growth_paused", False),
            "status": account.get("status"),
            "connected_at": account.get("connected_at"),
            "last_refreshed": account.get("last_refreshed")
        },
        "subscription": subscription,
        "targeting": targeting,
        "ai_analysis": ai_analysis,
        "growth_logs": growth_logs[:20],  # Last 20 logs
        "metrics": {
            "days_active": days_active,
            "daily_average_gain": daily_avg,
            "weekly_projected": round(daily_avg * 7, 2),
            "monthly_projected": round(daily_avg * 30, 2)
        }
    }
