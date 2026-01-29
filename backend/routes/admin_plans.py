from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from models.plans import DynamicPlan, PlanCreate, PlanUpdate, DEFAULT_PLANS
from models.admin_log import AdminLog, AdminAction
from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/admin/plans", tags=["Admin Plans"])

db = None

def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


@router.get("/", response_model=List[dict])
async def get_all_plans(include_hidden: bool = False, current_user: dict = Depends(admin_required)):
    """Get all plans (admin view - includes hidden plans)."""
    query = {} if include_hidden else {"is_hidden": {"$ne": True}}
    plans = await db.plans.find(query, {"_id": 0}).sort("display_order", 1).to_list(100)
    
    # If no plans exist, seed defaults
    if not plans:
        await seed_default_plans()
        plans = await db.plans.find(query, {"_id": 0}).sort("display_order", 1).to_list(100)
    
    return plans


@router.get("/{plan_id}")
async def get_plan(plan_id: str, current_user: dict = Depends(admin_required)):
    """Get a specific plan by ID."""
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.post("/")
async def create_plan(plan_data: PlanCreate, current_user: dict = Depends(admin_required)):
    """Create a new plan."""
    # Check if slug already exists
    existing = await db.plans.find_one({"slug": plan_data.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Plan with this slug already exists")
    
    plan = DynamicPlan(
        **plan_data.model_dump(),
        created_by=current_user['user_id'],
        updated_by=current_user['user_id']
    )
    
    plan_dict = plan.model_dump()
    plan_dict['created_at'] = plan_dict['created_at'].isoformat()
    plan_dict['updated_at'] = plan_dict['updated_at'].isoformat()
    
    await db.plans.insert_one(plan_dict)
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.SETTINGS_UPDATE,
        target_type="plan",
        target_id=plan.id,
        description=f"Created plan: {plan.name}"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Plan created successfully", "id": plan.id}


@router.put("/{plan_id}")
async def update_plan(plan_id: str, plan_data: PlanUpdate, current_user: dict = Depends(admin_required)):
    """Update an existing plan."""
    plan = await db.plans.find_one({"id": plan_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    update_dict = {k: v for k, v in plan_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_dict['updated_by'] = current_user['user_id']
    
    await db.plans.update_one({"id": plan_id}, {"$set": update_dict})
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.SETTINGS_UPDATE,
        target_type="plan",
        target_id=plan_id,
        description=f"Updated plan: {plan['name']}",
        previous_value={k: plan.get(k) for k in update_dict.keys() if k not in ['updated_at', 'updated_by']},
        new_value={k: v for k, v in update_dict.items() if k not in ['updated_at', 'updated_by']}
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Plan updated successfully"}


@router.post("/{plan_id}/clone")
async def clone_plan(plan_id: str, new_name: str, new_slug: str, current_user: dict = Depends(admin_required)):
    """Clone an existing plan."""
    plan = await db.plans.find_one({"id": plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if new slug exists
    existing = await db.plans.find_one({"slug": new_slug})
    if existing:
        raise HTTPException(status_code=400, detail="Plan with this slug already exists")
    
    # Create clone
    plan['id'] = str(uuid.uuid4())
    plan['name'] = new_name
    plan['slug'] = new_slug
    plan['is_popular'] = False
    plan['badge_text'] = None
    plan['created_at'] = datetime.now(timezone.utc).isoformat()
    plan['updated_at'] = datetime.now(timezone.utc).isoformat()
    plan['created_by'] = current_user['user_id']
    plan['updated_by'] = current_user['user_id']
    
    await db.plans.insert_one(plan)
    
    return {"message": "Plan cloned successfully", "id": plan['id']}


@router.delete("/{plan_id}")
async def delete_plan(plan_id: str, current_user: dict = Depends(admin_required)):
    """Delete a plan (soft delete - marks as inactive)."""
    plan = await db.plans.find_one({"id": plan_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if any users are on this plan
    users_on_plan = await db.subscriptions.count_documents({
        "plan": plan['slug'],
        "status": "active"
    })
    
    if users_on_plan > 0:
        # Soft delete - just hide it
        await db.plans.update_one(
            {"id": plan_id},
            {"$set": {"is_active": False, "is_hidden": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"message": f"Plan hidden (has {users_on_plan} active subscribers)"}
    else:
        # Hard delete if no users
        await db.plans.delete_one({"id": plan_id})
        return {"message": "Plan deleted successfully"}


@router.post("/{plan_id}/toggle-popular")
async def toggle_popular(plan_id: str, current_user: dict = Depends(admin_required)):
    """Toggle plan as popular (only one can be popular)."""
    plan = await db.plans.find_one({"id": plan_id})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Remove popular from all plans
    await db.plans.update_many({}, {"$set": {"is_popular": False, "badge_text": None}})
    
    # Set this plan as popular
    if not plan.get('is_popular'):
        await db.plans.update_one(
            {"id": plan_id},
            {"$set": {"is_popular": True, "badge_text": "Most Popular"}}
        )
    
    return {"message": "Popular plan updated"}


@router.post("/reorder")
async def reorder_plans(plan_orders: List[dict], current_user: dict = Depends(admin_required)):
    """Reorder plans. Expects [{"id": "...", "order": 1}, ...]"""
    for item in plan_orders:
        await db.plans.update_one(
            {"id": item['id']},
            {"$set": {"display_order": item['order']}}
        )
    return {"message": "Plans reordered"}


@router.post("/seed-defaults")
async def seed_defaults(current_user: dict = Depends(admin_required)):
    """Seed default plans (resets all plans)."""
    await seed_default_plans()
    return {"message": "Default plans seeded"}


async def seed_default_plans():
    """Seed default plans into database."""
    for plan_data in DEFAULT_PLANS:
        existing = await db.plans.find_one({"slug": plan_data['slug']})
        if not existing:
            plan = DynamicPlan(**plan_data)
            plan_dict = plan.model_dump()
            plan_dict['created_at'] = plan_dict['created_at'].isoformat()
            plan_dict['updated_at'] = plan_dict['updated_at'].isoformat()
            await db.plans.insert_one(plan_dict)
