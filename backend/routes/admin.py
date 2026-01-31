from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import random

from models.user import User, UserUpdate, UserRole, UserStatus, UserResponse
from models.subscription import Subscription, SubscriptionStatus, PlanType, PLAN_CONFIG
from models.payment import Payment, PaymentStatus
from models.instagram_account import InstagramAccount, AccountStatus, GrowthIntensity
from models.ticket import Ticket, TicketStatus, TicketUpdate
from models.notification import Notification, NotificationCreate, NotificationType
from models.admin_log import AdminLog, AdminLogCreate, AdminAction
from models.cms import CMSContent, CMSContentUpdate, Testimonial, FAQ, PlatformStats
from utils.auth import get_current_user, require_roles

router = APIRouter(prefix="/admin", tags=["Admin"])

db = None

def init_router(database):
    global db
    db = database


# Require admin or manager role for all admin endpoints
admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])
support_required = require_roles([UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPPORT])


# ==================== DASHBOARD ====================

class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_subscriptions: int
    active_subscriptions: int
    mrr: float
    arr: float
    total_revenue: float
    churn_rate: float
    new_users_this_month: int
    open_tickets: int


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(admin_required)):
    """Get admin dashboard statistics."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # User stats
    total_users = await db.users.count_documents({"role": UserRole.USER})
    active_users = await db.users.count_documents({"role": UserRole.USER, "status": UserStatus.ACTIVE})
    
    # New users this month
    new_users = await db.users.count_documents({
        "role": UserRole.USER,
        "created_at": {"$gte": month_start.isoformat()}
    })
    
    # Subscription stats
    total_subs = await db.subscriptions.count_documents({})
    active_subs = await db.subscriptions.count_documents({"status": SubscriptionStatus.ACTIVE})
    
    # Revenue calculation
    payments = await db.payments.find({"status": PaymentStatus.SUCCESS}).to_list(10000)
    total_revenue = sum(p.get('amount', 0) for p in payments)
    
    # Calculate MRR from active subscriptions
    active_sub_docs = await db.subscriptions.find({"status": SubscriptionStatus.ACTIVE}).to_list(1000)
    mrr = sum(s.get('price', 0) for s in active_sub_docs if s.get('billing_cycle') == 'monthly')
    mrr += sum(s.get('price', 0) / 12 for s in active_sub_docs if s.get('billing_cycle') == 'yearly')
    
    # Open tickets
    open_tickets = await db.tickets.count_documents({"status": {"$in": [TicketStatus.OPEN, TicketStatus.IN_PROGRESS]}})
    
    # Churn rate (simplified: cancelled / total this month)
    cancelled_this_month = await db.subscriptions.count_documents({
        "status": SubscriptionStatus.CANCELLED,
        "cancelled_at": {"$gte": month_start.isoformat()}
    })
    churn_rate = (cancelled_this_month / max(active_subs, 1)) * 100
    
    return DashboardStats(
        total_users=total_users,
        active_users=active_users,
        total_subscriptions=total_subs,
        active_subscriptions=active_subs,
        mrr=round(mrr, 2),
        arr=round(mrr * 12, 2),
        total_revenue=round(total_revenue, 2),
        churn_rate=round(churn_rate, 2),
        new_users_this_month=new_users,
        open_tickets=open_tickets
    )


# ==================== USER MANAGEMENT ====================

class UserAdminResponse(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    status: UserStatus
    current_plan: Optional[str]
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    subscription_status: Optional[str] = None
    instagram_username: Optional[str] = None


@router.get("/users", response_model=List[UserAdminResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(admin_required)
):
    """Get all users with filtering."""
    query = {}
    
    if role:
        query["role"] = role
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"name": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for u in users:
        # Get subscription status
        sub = await db.subscriptions.find_one({"user_id": u['id'], "status": SubscriptionStatus.ACTIVE})
        
        # Get Instagram username
        ig = await db.instagram_accounts.find_one({"user_id": u['id'], "status": {"$ne": AccountStatus.DISCONNECTED}})
        
        result.append(UserAdminResponse(
            id=u['id'],
            email=u['email'],
            name=u['name'],
            role=u.get('role', UserRole.USER),
            status=u.get('status', UserStatus.ACTIVE),
            current_plan=u.get('current_plan'),
            email_verified=u.get('email_verified', False),
            created_at=datetime.fromisoformat(u['created_at']) if isinstance(u['created_at'], str) else u['created_at'],
            last_login=datetime.fromisoformat(u['last_login']) if u.get('last_login') else None,
            subscription_status=sub['status'] if sub else None,
            instagram_username=ig['username'] if ig else None
        ))
    
    return result


@router.get("/users/{user_id}")
async def get_user_details(user_id: str, current_user: dict = Depends(admin_required)):
    """Get detailed user information including Instagram stats and growth progress."""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get subscription
    subscription = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    
    # Get Instagram account with stats
    instagram = await db.instagram_accounts.find_one({"user_id": user_id}, {"_id": 0})
    
    # Build instagram_stats from account data
    instagram_stats = None
    if instagram:
        instagram_stats = {
            "followers_count": instagram.get("followers_count", 0),
            "following_count": instagram.get("following_count", 0),
            "media_count": instagram.get("media_count", 0),
            "engagement_rate": instagram.get("engagement_rate", 0),
            "is_oauth_connected": instagram.get("is_oauth_connected", False),
            "last_synced": instagram.get("last_synced")
        }
    
    # Get payments
    payments = await db.payments.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    
    # Get tickets
    tickets = await db.tickets.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    # Calculate growth data if subscription exists
    growth_progress = None
    if subscription and instagram:
        start_followers = subscription.get("start_followers", instagram.get("initial_followers", 0))
        current_followers = instagram.get("followers_count", start_followers)
        
        # Get plan details to determine target
        plan = await db.plans.find_one({"name": {"$regex": f"^{user.get('current_plan', '')}$", "$options": "i"}}, {"_id": 0})
        if plan:
            target_followers = plan.get("follower_target_max") or plan.get("follower_target") or 1500
            gained = max(0, current_followers - start_followers)
            progress = min(100, round((gained / target_followers) * 100))
            
            growth_progress = {
                "target": target_followers,
                "start": start_followers,
                "current": current_followers,
                "gained": gained,
                "progress": progress,
                "is_complete": progress >= 100
            }
    
    # Build response with all needed data for frontend
    response = {
        **user,
        "instagram_username": instagram.get("username") if instagram else None,
        "instagram_stats": instagram_stats,
        "subscription": subscription,
        "growth_progress": growth_progress,
        "payments": payments,
        "tickets": tickets
    }
    
    return response


@router.put("/users/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, current_user: dict = Depends(admin_required)):
    """Update user (admin can change role, status, plan). Also creates subscription when plan is assigned."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    # Check if plan is being changed
    new_plan = update_dict.get('current_plan')
    old_plan = user.get('current_plan')
    
    await db.users.update_one({"id": user_id}, {"$set": update_dict})
    
    # If admin assigned/changed a plan, create or update subscription record
    if new_plan and new_plan != old_plan:
        # Get plan details for pricing
        plan_doc = await db.plans.find_one(
            {"name": {"$regex": f"^{new_plan}$", "$options": "i"}},
            {"_id": 0}
        )
        plan_price = plan_doc.get("monthly_price", 49) if plan_doc else 49
        
        # Get user's current Instagram followers for growth tracking
        instagram = await db.instagram_accounts.find_one({"user_id": user_id}, {"_id": 0})
        start_followers = instagram.get("followers_count", 0) if instagram else 0
        
        # Check if subscription exists
        existing_sub = await db.subscriptions.find_one({"user_id": user_id})
        
        now = datetime.now(timezone.utc)
        next_billing = now + timedelta(days=30)
        
        if existing_sub:
            # Update existing subscription
            await db.subscriptions.update_one(
                {"user_id": user_id},
                {"$set": {
                    "plan": new_plan,
                    "status": "active",
                    "price": plan_price,
                    "amount": plan_price,
                    "start_followers": start_followers,
                    "admin_assigned": True,
                    "assigned_by": current_user['email'],
                    "assigned_at": now.isoformat(),
                    "updated_at": now.isoformat()
                }}
            )
        else:
            # Create new subscription
            import uuid
            subscription_data = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "user_email": user.get("email"),
                "user_name": user.get("name"),
                "plan": new_plan,
                "billing_cycle": "monthly",
                "status": "active",
                "price": plan_price,
                "amount": plan_price,
                "start_followers": start_followers,
                "admin_assigned": True,
                "assigned_by": current_user['email'],
                "payment_method": "admin_assigned",
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "start_date": now.isoformat(),
                "next_billing_date": next_billing.isoformat()
            }
            await db.subscriptions.insert_one(subscription_data)
    
    # Log admin action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.USER_UPDATE,
        target_type="user",
        target_id=user_id,
        description=f"Updated user {user['email']}" + (f" - assigned {new_plan} plan" if new_plan and new_plan != old_plan else ""),
        previous_value={k: user.get(k) for k in update_dict.keys() if k != 'updated_at'},
        new_value={k: v for k, v in update_dict.items() if k != 'updated_at'}
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "User updated successfully" + (f" with {new_plan} plan subscription created" if new_plan and new_plan != old_plan else "")}


@router.post("/users/{user_id}/suspend")
async def suspend_user(user_id: str, current_user: dict = Depends(admin_required)):
    """Suspend a user."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"status": UserStatus.SUSPENDED, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Also pause their Instagram growth
    await db.instagram_accounts.update_many(
        {"user_id": user_id},
        {"$set": {"growth_paused": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.USER_SUSPEND,
        target_type="user",
        target_id=user_id,
        description=f"Suspended user {user['email']}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "User suspended"}


@router.post("/users/{user_id}/activate")
async def activate_user(user_id: str, current_user: dict = Depends(admin_required)):
    """Activate a user (also verifies email)."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "status": UserStatus.ACTIVE, 
            "email_verified": True,  # Also verify email when admin activates
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.USER_ACTIVATE,
        target_type="user",
        target_id=user_id,
        description=f"Activated user {user['email']}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "User activated"}


@router.post("/users/bulk-activate")
async def bulk_activate_pending_users(current_user: dict = Depends(admin_required)):
    """Activate all pending_verification users at once."""
    result = await db.users.update_many(
        {"status": "pending_verification"},
        {"$set": {
            "status": UserStatus.ACTIVE,
            "email_verified": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.USER_UPDATE,
        target_type="bulk_users",
        description=f"Bulk activated {result.modified_count} pending users"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": f"Activated {result.modified_count} users", "count": result.modified_count}


# ==================== SUBSCRIPTION MANAGEMENT ====================

@router.get("/subscriptions")
async def get_all_subscriptions(
    skip: int = 0,
    limit: int = 50,
    status: Optional[SubscriptionStatus] = None,
    plan: Optional[PlanType] = None,
    current_user: dict = Depends(admin_required)
):
    """Get all subscriptions."""
    query = {}
    if status:
        query["status"] = status
    if plan:
        query["plan"] = plan
    
    subs = await db.subscriptions.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user info
    result = []
    for s in subs:
        user = await db.users.find_one({"id": s['user_id']}, {"email": 1, "name": 1})
        s['user_email'] = user['email'] if user else 'Unknown'
        s['user_name'] = user['name'] if user else 'Unknown'
        result.append(s)
    
    return result


@router.post("/subscriptions/{user_id}/change-plan")
async def admin_change_plan(
    user_id: str,
    new_plan: PlanType,
    current_user: dict = Depends(admin_required)
):
    """Admin can change user's plan."""
    sub = await db.subscriptions.find_one({"user_id": user_id, "status": SubscriptionStatus.ACTIVE})
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    old_plan = sub['plan']
    plan_details = PLAN_CONFIG[new_plan]
    new_price = plan_details.yearly_price if sub.get('billing_cycle') == 'yearly' else plan_details.monthly_price
    
    await db.subscriptions.update_one(
        {"id": sub['id']},
        {"$set": {
            "plan": new_plan,
            "price": new_price,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"current_plan": new_plan.value}}
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.PLAN_CHANGE,
        target_type="subscription",
        target_id=sub['id'],
        description=f"Changed plan from {old_plan} to {new_plan}",
        previous_value={"plan": old_plan},
        new_value={"plan": new_plan}
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": f"Plan changed to {new_plan}"}


@router.post("/subscriptions/{subscription_id}/cancel")
async def admin_cancel_subscription(
    subscription_id: str,
    current_user: dict = Depends(admin_required)
):
    """Admin can cancel a subscription."""
    sub = await db.subscriptions.find_one({"id": subscription_id})
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    if sub['status'] == SubscriptionStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Subscription already cancelled")
    
    await db.subscriptions.update_one(
        {"id": subscription_id},
        {"$set": {
            "status": SubscriptionStatus.CANCELLED,
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.users.update_one(
        {"id": sub['user_id']},
        {"$set": {"current_plan": None}}
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.SUBSCRIPTION_CANCEL,
        target_type="subscription",
        target_id=subscription_id,
        description=f"Cancelled subscription {subscription_id}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Subscription cancelled"}


# ==================== PAYMENT MANAGEMENT ====================

@router.get("/payments")
async def get_all_payments(
    skip: int = 0,
    limit: int = 50,
    status: Optional[PaymentStatus] = None,
    current_user: dict = Depends(admin_required)
):
    """Get all payments."""
    query = {}
    if status:
        query["status"] = status
    
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user info
    for p in payments:
        user = await db.users.find_one({"id": p['user_id']}, {"email": 1, "name": 1})
        p['user_email'] = user['email'] if user else 'Unknown'
    
    return payments


@router.post("/payments/{payment_id}/refund")
async def process_refund(
    payment_id: str,
    amount: Optional[float] = None,
    reason: Optional[str] = None,
    current_user: dict = Depends(admin_required)
):
    """Process a refund."""
    payment = await db.payments.find_one({"id": payment_id})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment['status'] in [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED]:
        raise HTTPException(status_code=400, detail="Payment already refunded")
    
    refund_amount = amount or payment['amount']
    
    if refund_amount > payment['amount']:
        raise HTTPException(status_code=400, detail="Refund amount exceeds payment amount")
    
    new_status = PaymentStatus.REFUNDED if refund_amount == payment['amount'] else PaymentStatus.PARTIALLY_REFUNDED
    
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "status": new_status,
            "refund_amount": refund_amount,
            "refund_reason": reason,
            "refunded_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.REFUND_PROCESS,
        target_type="payment",
        target_id=payment_id,
        description=f"Refunded ${refund_amount} - Reason: {reason or 'Not specified'}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": f"Refund of ${refund_amount} processed successfully"}


# ==================== INSTAGRAM/GROWTH MANAGEMENT ====================

@router.get("/instagram-accounts")
async def get_all_instagram_accounts(
    skip: int = 0,
    limit: int = 50,
    status: Optional[AccountStatus] = None,
    current_user: dict = Depends(admin_required)
):
    """Get all Instagram accounts."""
    query = {}
    if status:
        query["status"] = status
    
    accounts = await db.instagram_accounts.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user info
    for a in accounts:
        user = await db.users.find_one({"id": a['user_id']}, {"email": 1, "name": 1})
        a['user_email'] = user['email'] if user else 'Unknown'
    
    return accounts


@router.post("/instagram-accounts/{account_id}/update-growth")
async def admin_update_growth(
    account_id: str,
    intensity: Optional[GrowthIntensity] = None,
    paused: Optional[bool] = None,
    current_user: dict = Depends(admin_required)
):
    """Admin can adjust growth settings."""
    account = await db.instagram_accounts.find_one({"id": account_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if intensity:
        update["growth_intensity"] = intensity
    if paused is not None:
        update["growth_paused"] = paused
    
    await db.instagram_accounts.update_one({"id": account_id}, {"$set": update})
    
    action = AdminAction.ACCOUNT_PAUSE if paused else AdminAction.GROWTH_SPEED_CHANGE if intensity else AdminAction.ACCOUNT_RESUME
    
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=action,
        target_type="instagram_account",
        target_id=account_id,
        description=f"Updated @{account['username']}: intensity={intensity}, paused={paused}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Growth settings updated"}


@router.put("/instagram-accounts/{account_id}")
async def admin_update_instagram_account(
    account_id: str,
    update_data: dict,
    current_user: dict = Depends(admin_required)
):
    """Admin can update instagram account settings."""
    account = await db.instagram_accounts.find_one({"id": account_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    allowed_fields = ["growth_paused", "growth_intensity", "niche", "status"]
    update = {k: v for k, v in update_data.items() if k in allowed_fields}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.instagram_accounts.update_one({"id": account_id}, {"$set": update})
    
    return {"message": "Account updated"}


# ==================== TICKET MANAGEMENT ====================

@router.get("/tickets")
async def get_all_tickets(
    skip: int = 0,
    limit: int = 50,
    status: Optional[TicketStatus] = None,
    current_user: dict = Depends(support_required)
):
    """Get all support tickets."""
    query = {}
    if status:
        query["status"] = status
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with user info
    for t in tickets:
        user = await db.users.find_one({"id": t['user_id']}, {"email": 1, "name": 1})
        t['user_email'] = user['email'] if user else 'Unknown'
        t['user_name'] = user['name'] if user else 'Unknown'
    
    return tickets


@router.put("/tickets/{ticket_id}")
async def admin_update_ticket(
    ticket_id: str,
    update: TicketUpdate,
    current_user: dict = Depends(support_required)
):
    """Admin/Support can update ticket status, priority, assignment."""
    ticket = await db.tickets.find_one({"id": ticket_id})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if update.status == TicketStatus.RESOLVED:
        update_dict['resolved_at'] = datetime.now(timezone.utc).isoformat()
    elif update.status == TicketStatus.CLOSED:
        update_dict['closed_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.tickets.update_one({"id": ticket_id}, {"$set": update_dict})
    
    return {"message": "Ticket updated"}


# ==================== NOTIFICATIONS / ANNOUNCEMENTS ====================

@router.post("/notifications/broadcast")
async def broadcast_notification(
    notification: NotificationCreate,
    current_user: dict = Depends(admin_required)
):
    """Send a notification to all users or specific user."""
    notif = Notification(
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        notification_type=notification.notification_type,
        action_url=notification.action_url,
        action_text=notification.action_text
    )
    
    notif_dict = notif.model_dump()
    notif_dict['created_at'] = notif_dict['created_at'].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.ANNOUNCEMENT_CREATE,
        target_type="notification",
        target_id=notif.id,
        description=f"Created notification: {notification.title}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Notification sent", "notification_id": notif.id}


# ==================== CMS MANAGEMENT ====================

@router.get("/cms/{key}")
async def get_cms_content(key: str, current_user: dict = Depends(admin_required)):
    """Get CMS content by key."""
    content = await db.cms_content.find_one({"key": key}, {"_id": 0})
    return content


@router.put("/cms/{key}")
async def update_cms_content(
    key: str,
    update: CMSContentUpdate,
    current_user: dict = Depends(admin_required)
):
    """Update CMS content."""
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_dict['updated_by'] = current_user['user_id']
    
    result = await db.cms_content.update_one(
        {"key": key},
        {"$set": update_dict},
        upsert=True
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.CMS_UPDATE,
        target_type="cms",
        target_id=key,
        description=f"Updated CMS content: {key}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "CMS content updated"}


# ==================== ADMIN LOGS ====================

@router.get("/logs")
async def get_admin_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[AdminAction] = None,
    current_user: dict = Depends(admin_required)
):
    """Get admin activity logs."""
    query = {}
    if action:
        query["action"] = action
    
    logs = await db.admin_logs.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return logs
