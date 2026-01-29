"""
Export Analytics Data for Adverlyx Digital.
Export platform data to CSV, JSON, and PDF formats.
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import io
import csv
import json

from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/admin/export", tags=["Data Export"])

db = None

def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# ==================== EXPORT ROUTES ====================

@router.get("/users")
async def export_users(
    format: str = "csv",
    include_sensitive: bool = False,
    current_user: dict = Depends(admin_required)
):
    """Export user data."""
    # Projection - exclude sensitive fields by default
    projection = {"_id": 0, "password_hash": 0, "reset_token": 0, "verification_token": 0}
    if not include_sensitive:
        projection["two_factor_secret"] = 0
        projection["backup_codes"] = 0
    
    users = await db.users.find({}, projection).to_list(10000)
    
    if format == "csv":
        return create_csv_response(users, "users_export.csv")
    elif format == "json":
        return create_json_response(users, "users_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Use 'csv' or 'json'")


@router.get("/subscriptions")
async def export_subscriptions(
    format: str = "csv",
    status_filter: Optional[str] = None,
    current_user: dict = Depends(admin_required)
):
    """Export subscription data."""
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    subscriptions = await db.subscriptions.find(query, {"_id": 0}).to_list(10000)
    
    # Enrich with user data
    for sub in subscriptions:
        user = await db.users.find_one(
            {"id": sub.get("user_id")},
            {"name": 1, "email": 1, "_id": 0}
        )
        if user:
            sub["user_name"] = user.get("name", "")
            sub["user_email"] = user.get("email", "")
    
    if format == "csv":
        return create_csv_response(subscriptions, "subscriptions_export.csv")
    elif format == "json":
        return create_json_response(subscriptions, "subscriptions_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format")


@router.get("/payments")
async def export_payments(
    format: str = "csv",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(admin_required)
):
    """Export payment data."""
    query = {}
    
    if start_date or end_date:
        query["created_at"] = {}
        if start_date:
            query["created_at"]["$gte"] = start_date
        if end_date:
            query["created_at"]["$lte"] = end_date
    
    if status_filter:
        query["status"] = status_filter
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(10000)
    
    # Also include payment_transactions
    transactions = await db.payment_transactions.find(query, {"_id": 0}).to_list(10000)
    
    all_payments = payments + transactions
    all_payments.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    if format == "csv":
        return create_csv_response(all_payments, "payments_export.csv")
    elif format == "json":
        return create_json_response(all_payments, "payments_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format")


@router.get("/analytics")
async def export_analytics(
    format: str = "csv",
    period_days: int = 30,
    current_user: dict = Depends(admin_required)
):
    """Export analytics data."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=period_days)
    
    # Gather analytics data
    analytics = {
        "export_date": now.isoformat(),
        "period_days": period_days,
        "metrics": {}
    }
    
    # User metrics
    total_users = await db.users.count_documents({"role": "user"})
    active_users = await db.users.count_documents({"role": "user", "status": "active"})
    new_users = await db.users.count_documents({
        "role": "user",
        "created_at": {"$gte": start_date.isoformat()}
    })
    
    analytics["metrics"]["users"] = {
        "total": total_users,
        "active": active_users,
        "new_in_period": new_users
    }
    
    # Subscription metrics
    total_subs = await db.subscriptions.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": "active"})
    cancelled_subs = await db.subscriptions.count_documents({
        "status": "cancelled",
        "cancelled_at": {"$gte": start_date.isoformat()}
    })
    
    analytics["metrics"]["subscriptions"] = {
        "total": total_subs,
        "active": active_subs,
        "cancelled_in_period": cancelled_subs
    }
    
    # Revenue metrics
    pipeline = [
        {"$match": {
            "status": {"$in": ["success", "paid"]},
            "created_at": {"$gte": start_date.isoformat()}
        }},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    revenue_result = await db.payments.aggregate(pipeline).to_list(1)
    if not revenue_result:
        revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    
    if revenue_result:
        analytics["metrics"]["revenue"] = {
            "total_in_period": revenue_result[0].get("total_revenue", 0),
            "transaction_count": revenue_result[0].get("count", 0)
        }
    else:
        analytics["metrics"]["revenue"] = {"total_in_period": 0, "transaction_count": 0}
    
    # Plan distribution
    plan_dist = await db.subscriptions.aggregate([
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$plan", "count": {"$sum": 1}}}
    ]).to_list(10)
    
    analytics["metrics"]["plan_distribution"] = {
        item["_id"]: item["count"] for item in plan_dist
    }
    
    # Daily breakdown
    daily_data = []
    for i in range(period_days):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        new_users_day = await db.users.count_documents({
            "role": "user",
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        new_subs_day = await db.subscriptions.count_documents({
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lt": day_end.isoformat()
            }
        })
        
        daily_data.append({
            "date": day_start.strftime("%Y-%m-%d"),
            "new_users": new_users_day,
            "new_subscriptions": new_subs_day
        })
    
    analytics["daily_breakdown"] = list(reversed(daily_data))
    
    if format == "csv":
        # Flatten for CSV
        flat_data = []
        for day in analytics["daily_breakdown"]:
            flat_data.append(day)
        return create_csv_response(flat_data, "analytics_export.csv")
    elif format == "json":
        return create_json_response(analytics, "analytics_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format")


@router.get("/instagram-accounts")
async def export_instagram_accounts(
    format: str = "csv",
    current_user: dict = Depends(admin_required)
):
    """Export Instagram account data."""
    accounts = await db.instagram_accounts.find({}, {"_id": 0}).to_list(10000)
    
    # Enrich with user data
    for account in accounts:
        user = await db.users.find_one(
            {"id": account.get("user_id")},
            {"name": 1, "email": 1, "_id": 0}
        )
        if user:
            account["user_name"] = user.get("name", "")
            account["user_email"] = user.get("email", "")
    
    if format == "csv":
        return create_csv_response(accounts, "instagram_accounts_export.csv")
    elif format == "json":
        return create_json_response(accounts, "instagram_accounts_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format")


@router.get("/tickets")
async def export_tickets(
    format: str = "csv",
    status_filter: Optional[str] = None,
    current_user: dict = Depends(admin_required)
):
    """Export support ticket data."""
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    tickets = await db.tickets.find(query, {"_id": 0}).to_list(10000)
    
    if format == "csv":
        return create_csv_response(tickets, "tickets_export.csv")
    elif format == "json":
        return create_json_response(tickets, "tickets_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format")


@router.get("/funnel-events")
async def export_funnel_events(
    format: str = "csv",
    days: int = 30,
    current_user: dict = Depends(admin_required)
):
    """Export funnel/analytics events."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    events = await db.funnel_events.find(
        {"timestamp": {"$gte": start_date.isoformat()}},
        {"_id": 0}
    ).to_list(50000)
    
    if format == "csv":
        return create_csv_response(events, "funnel_events_export.csv")
    elif format == "json":
        return create_json_response(events, "funnel_events_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format")


@router.get("/growth-logs")
async def export_growth_logs(
    format: str = "csv",
    days: int = 30,
    current_user: dict = Depends(admin_required)
):
    """Export Instagram growth logs."""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    logs = await db.growth_logs.find(
        {"created_at": {"$gte": start_date.isoformat()}},
        {"_id": 0}
    ).to_list(50000)
    
    if format == "csv":
        return create_csv_response(logs, "growth_logs_export.csv")
    elif format == "json":
        return create_json_response(logs, "growth_logs_export.json")
    else:
        raise HTTPException(status_code=400, detail="Invalid format")


@router.get("/full-report")
async def export_full_report(
    format: str = "json",
    period_days: int = 30,
    current_user: dict = Depends(admin_required)
):
    """Export comprehensive platform report."""
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=period_days)
    
    report = {
        "generated_at": now.isoformat(),
        "generated_by": current_user.get("email"),
        "period_days": period_days,
        "platform_summary": {},
        "users": {},
        "subscriptions": {},
        "revenue": {},
        "instagram": {},
        "support": {}
    }
    
    # Platform summary
    report["platform_summary"] = {
        "total_users": await db.users.count_documents({"role": "user"}),
        "active_subscriptions": await db.subscriptions.count_documents({"status": "active"}),
        "total_instagram_accounts": await db.instagram_accounts.count_documents({}),
        "open_tickets": await db.tickets.count_documents({"status": "open"})
    }
    
    # Users breakdown
    report["users"] = {
        "total": await db.users.count_documents({"role": "user"}),
        "active": await db.users.count_documents({"role": "user", "status": "active"}),
        "new_in_period": await db.users.count_documents({
            "role": "user",
            "created_at": {"$gte": start_date.isoformat()}
        })
    }
    
    # Subscriptions breakdown
    report["subscriptions"] = {
        "total": await db.subscriptions.count_documents({}),
        "active": await db.subscriptions.count_documents({"status": "active"}),
        "cancelled_in_period": await db.subscriptions.count_documents({
            "cancelled_at": {"$gte": start_date.isoformat()}
        }),
        "by_plan": {}
    }
    
    plan_breakdown = await db.subscriptions.aggregate([
        {"$group": {"_id": "$plan", "count": {"$sum": 1}}}
    ]).to_list(10)
    report["subscriptions"]["by_plan"] = {item["_id"]: item["count"] for item in plan_breakdown}
    
    # Revenue
    revenue_pipeline = [
        {"$match": {"status": {"$in": ["success", "paid"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    total_revenue = await db.payments.aggregate(revenue_pipeline).to_list(1)
    if not total_revenue:
        total_revenue = await db.payment_transactions.aggregate(revenue_pipeline).to_list(1)
    
    period_revenue_pipeline = [
        {"$match": {
            "status": {"$in": ["success", "paid"]},
            "created_at": {"$gte": start_date.isoformat()}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    period_revenue = await db.payments.aggregate(period_revenue_pipeline).to_list(1)
    if not period_revenue:
        period_revenue = await db.payment_transactions.aggregate(period_revenue_pipeline).to_list(1)
    
    report["revenue"] = {
        "total_lifetime": total_revenue[0]["total"] if total_revenue else 0,
        "in_period": period_revenue[0]["total"] if period_revenue else 0,
        "mrr": (period_revenue[0]["total"] if period_revenue else 0) / (period_days / 30)
    }
    
    # Instagram stats
    ig_stats = await db.instagram_accounts.aggregate([
        {"$group": {
            "_id": None,
            "total_accounts": {"$sum": 1},
            "total_followers": {"$sum": "$followers_count"},
            "total_gained": {"$sum": "$total_followers_gained"}
        }}
    ]).to_list(1)
    
    if ig_stats:
        report["instagram"] = {
            "total_accounts": ig_stats[0].get("total_accounts", 0),
            "total_followers_tracked": ig_stats[0].get("total_followers", 0),
            "total_followers_gained": ig_stats[0].get("total_gained", 0)
        }
    
    # Support stats
    report["support"] = {
        "total_tickets": await db.tickets.count_documents({}),
        "open_tickets": await db.tickets.count_documents({"status": "open"}),
        "resolved_tickets": await db.tickets.count_documents({"status": "resolved"}),
        "tickets_in_period": await db.tickets.count_documents({
            "created_at": {"$gte": start_date.isoformat()}
        })
    }
    
    if format == "json":
        return create_json_response(report, "full_platform_report.json")
    else:
        raise HTTPException(status_code=400, detail="Full report only available in JSON format")


# ==================== HELPER FUNCTIONS ====================

def create_csv_response(data: list, filename: str) -> StreamingResponse:
    """Create a CSV file response."""
    if not data:
        output = io.StringIO()
        output.write("No data available")
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    output = io.StringIO()
    
    # Get all unique keys across all records
    all_keys = set()
    for record in data:
        if isinstance(record, dict):
            all_keys.update(record.keys())
    
    # Sort keys for consistent output
    fieldnames = sorted(list(all_keys))
    
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for record in data:
        if isinstance(record, dict):
            # Convert nested objects to strings
            flat_record = {}
            for key, value in record.items():
                if isinstance(value, (dict, list)):
                    flat_record[key] = json.dumps(value)
                else:
                    flat_record[key] = value
            writer.writerow(flat_record)
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


def create_json_response(data, filename: str) -> StreamingResponse:
    """Create a JSON file response."""
    output = io.StringIO()
    json.dump(data, output, indent=2, default=str)
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
