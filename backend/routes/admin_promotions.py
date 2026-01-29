from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from models.promotion import (
    IdealCustomerProfile, ABTest, ABTestVariant, ABTestStatus,
    Campaign, CampaignStatus, CampaignType, ContentTemplate,
    DEFAULT_ICPS
)
from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/admin/promotions", tags=["Admin Promotions"])

db = None

def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# ==================== ICP MANAGEMENT ====================

@router.get("/icps")
async def get_all_icps(current_user: dict = Depends(admin_required)):
    """Get all Ideal Customer Profiles."""
    icps = await db.icps.find({}, {"_id": 0}).sort("priority_score", -1).to_list(100)
    
    if not icps:
        await seed_default_icps()
        icps = await db.icps.find({}, {"_id": 0}).sort("priority_score", -1).to_list(100)
    
    return icps


@router.get("/icps/{icp_id}")
async def get_icp(icp_id: str, current_user: dict = Depends(admin_required)):
    """Get a specific ICP."""
    icp = await db.icps.find_one({"id": icp_id}, {"_id": 0})
    if not icp:
        raise HTTPException(status_code=404, detail="ICP not found")
    return icp


@router.post("/icps")
async def create_icp(icp_data: dict, current_user: dict = Depends(admin_required)):
    """Create a new ICP."""
    icp = IdealCustomerProfile(**icp_data)
    icp_dict = icp.model_dump()
    icp_dict['created_at'] = icp_dict['created_at'].isoformat()
    icp_dict['updated_at'] = icp_dict['updated_at'].isoformat()
    icp_dict['created_by'] = current_user['user_id']
    
    await db.icps.insert_one(icp_dict)
    return {"id": icp.id, "message": "ICP created successfully"}


@router.put("/icps/{icp_id}")
async def update_icp(icp_id: str, icp_data: dict, current_user: dict = Depends(admin_required)):
    """Update an ICP."""
    existing = await db.icps.find_one({"id": icp_id})
    if not existing:
        raise HTTPException(status_code=404, detail="ICP not found")
    
    icp_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.icps.update_one({"id": icp_id}, {"$set": icp_data})
    return {"message": "ICP updated successfully"}


@router.delete("/icps/{icp_id}")
async def delete_icp(icp_id: str, current_user: dict = Depends(admin_required)):
    """Delete an ICP."""
    result = await db.icps.delete_one({"id": icp_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="ICP not found")
    return {"message": "ICP deleted successfully"}


@router.post("/icps/{icp_id}/set-primary")
async def set_primary_icp(icp_id: str, current_user: dict = Depends(admin_required)):
    """Set an ICP as primary."""
    # Remove primary from all
    await db.icps.update_many({}, {"$set": {"is_primary": False}})
    # Set this one as primary
    await db.icps.update_one({"id": icp_id}, {"$set": {"is_primary": True}})
    return {"message": "Primary ICP updated"}


# ==================== A/B TESTING ====================

@router.get("/ab-tests")
async def get_all_ab_tests(
    status: Optional[str] = None,
    current_user: dict = Depends(admin_required)
):
    """Get all A/B tests."""
    query = {}
    if status:
        query["status"] = status
    
    tests = await db.ab_tests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tests


@router.get("/ab-tests/{test_id}")
async def get_ab_test(test_id: str, current_user: dict = Depends(admin_required)):
    """Get a specific A/B test."""
    test = await db.ab_tests.find_one({"id": test_id}, {"_id": 0})
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    return test


@router.post("/ab-tests")
async def create_ab_test(test_data: dict, current_user: dict = Depends(admin_required)):
    """Create a new A/B test."""
    test = ABTest(**test_data)
    
    # Add default control variant if no variants
    if not test.variants:
        test.variants = [
            ABTestVariant(name="Control", is_control=True),
            ABTestVariant(name="Variant A")
        ]
    
    test_dict = test.model_dump()
    test_dict['created_at'] = test_dict['created_at'].isoformat()
    test_dict['updated_at'] = test_dict['updated_at'].isoformat()
    test_dict['created_by'] = current_user['user_id']
    
    # Convert variant datetimes if present
    for variant in test_dict.get('variants', []):
        for key in ['start_date', 'end_date']:
            if key in test_dict and test_dict[key]:
                test_dict[key] = test_dict[key].isoformat() if hasattr(test_dict[key], 'isoformat') else test_dict[key]
    
    await db.ab_tests.insert_one(test_dict)
    return {"id": test.id, "message": "A/B test created successfully"}


@router.put("/ab-tests/{test_id}")
async def update_ab_test(test_id: str, test_data: dict, current_user: dict = Depends(admin_required)):
    """Update an A/B test."""
    existing = await db.ab_tests.find_one({"id": test_id})
    if not existing:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    test_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.ab_tests.update_one({"id": test_id}, {"$set": test_data})
    return {"message": "A/B test updated successfully"}


@router.post("/ab-tests/{test_id}/start")
async def start_ab_test(test_id: str, current_user: dict = Depends(admin_required)):
    """Start an A/B test."""
    test = await db.ab_tests.find_one({"id": test_id})
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    await db.ab_tests.update_one(
        {"id": test_id},
        {"$set": {
            "status": ABTestStatus.RUNNING.value,
            "start_date": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "A/B test started"}


@router.post("/ab-tests/{test_id}/stop")
async def stop_ab_test(test_id: str, current_user: dict = Depends(admin_required)):
    """Stop an A/B test."""
    await db.ab_tests.update_one(
        {"id": test_id},
        {"$set": {
            "status": ABTestStatus.COMPLETED.value,
            "end_date": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "A/B test stopped"}


@router.post("/ab-tests/{test_id}/select-winner/{variant_id}")
async def select_winner(test_id: str, variant_id: str, current_user: dict = Depends(admin_required)):
    """Select a winner for an A/B test."""
    test = await db.ab_tests.find_one({"id": test_id})
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    # Update variants - set winner
    variants = test.get('variants', [])
    for v in variants:
        v['is_winner'] = (v['id'] == variant_id)
    
    await db.ab_tests.update_one(
        {"id": test_id},
        {"$set": {
            "status": ABTestStatus.WINNER_SELECTED.value,
            "winning_variant_id": variant_id,
            "variants": variants,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Winner selected"}


@router.post("/ab-tests/{test_id}/record-event")
async def record_ab_event(
    test_id: str,
    variant_id: str,
    event_type: str,  # "impression", "click", "conversion"
    revenue: float = 0,
    current_user: dict = Depends(admin_required)
):
    """Record an event for A/B test tracking."""
    test = await db.ab_tests.find_one({"id": test_id})
    if not test:
        raise HTTPException(status_code=404, detail="A/B test not found")
    
    # Update variant metrics
    variants = test.get('variants', [])
    for v in variants:
        if v['id'] == variant_id:
            if event_type == "impression":
                v['impressions'] = v.get('impressions', 0) + 1
            elif event_type == "click":
                v['clicks'] = v.get('clicks', 0) + 1
            elif event_type == "conversion":
                v['conversions'] = v.get('conversions', 0) + 1
                v['revenue'] = v.get('revenue', 0) + revenue
            
            # Recalculate rates
            impressions = v.get('impressions', 0)
            clicks = v.get('clicks', 0)
            conversions = v.get('conversions', 0)
            
            v['click_rate'] = (clicks / impressions * 100) if impressions > 0 else 0
            v['conversion_rate'] = (conversions / clicks * 100) if clicks > 0 else 0
            v['revenue_per_visitor'] = v.get('revenue', 0) / impressions if impressions > 0 else 0
    
    await db.ab_tests.update_one({"id": test_id}, {"$set": {"variants": variants}})
    return {"message": "Event recorded"}


# ==================== CAMPAIGNS ====================

@router.get("/campaigns")
async def get_all_campaigns(
    status: Optional[str] = None,
    campaign_type: Optional[str] = None,
    current_user: dict = Depends(admin_required)
):
    """Get all campaigns."""
    query = {}
    if status:
        query["status"] = status
    if campaign_type:
        query["campaign_type"] = campaign_type
    
    campaigns = await db.campaigns.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return campaigns


@router.get("/campaigns/{campaign_id}")
async def get_campaign(campaign_id: str, current_user: dict = Depends(admin_required)):
    """Get a specific campaign."""
    campaign = await db.campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post("/campaigns")
async def create_campaign(campaign_data: dict, current_user: dict = Depends(admin_required)):
    """Create a new campaign."""
    campaign = Campaign(**campaign_data)
    campaign_dict = campaign.model_dump()
    campaign_dict['created_at'] = campaign_dict['created_at'].isoformat()
    campaign_dict['updated_at'] = campaign_dict['updated_at'].isoformat()
    campaign_dict['created_by'] = current_user['user_id']
    
    # Handle nested datetime fields
    if campaign_dict.get('schedule', {}).get('start_date'):
        campaign_dict['schedule']['start_date'] = campaign_dict['schedule']['start_date'].isoformat() if hasattr(campaign_dict['schedule']['start_date'], 'isoformat') else campaign_dict['schedule']['start_date']
    if campaign_dict.get('schedule', {}).get('end_date'):
        campaign_dict['schedule']['end_date'] = campaign_dict['schedule']['end_date'].isoformat() if hasattr(campaign_dict['schedule']['end_date'], 'isoformat') else campaign_dict['schedule']['end_date']
    
    await db.campaigns.insert_one(campaign_dict)
    return {"id": campaign.id, "message": "Campaign created successfully"}


@router.put("/campaigns/{campaign_id}")
async def update_campaign(campaign_id: str, campaign_data: dict, current_user: dict = Depends(admin_required)):
    """Update a campaign."""
    existing = await db.campaigns.find_one({"id": campaign_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.campaigns.update_one({"id": campaign_id}, {"$set": campaign_data})
    return {"message": "Campaign updated successfully"}


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: dict = Depends(admin_required)):
    """Delete a campaign."""
    result = await db.campaigns.delete_one({"id": campaign_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return {"message": "Campaign deleted successfully"}


@router.post("/campaigns/{campaign_id}/launch")
async def launch_campaign(campaign_id: str, current_user: dict = Depends(admin_required)):
    """Launch a campaign."""
    campaign = await db.campaigns.find_one({"id": campaign_id})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": CampaignStatus.ACTIVE.value,
            "launched_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Campaign launched"}


@router.post("/campaigns/{campaign_id}/pause")
async def pause_campaign(campaign_id: str, current_user: dict = Depends(admin_required)):
    """Pause a campaign."""
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": CampaignStatus.PAUSED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Campaign paused"}


@router.post("/campaigns/{campaign_id}/complete")
async def complete_campaign(campaign_id: str, current_user: dict = Depends(admin_required)):
    """Mark campaign as completed."""
    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {
            "status": CampaignStatus.COMPLETED.value,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Campaign completed"}


# ==================== CONTENT TEMPLATES ====================

@router.get("/templates")
async def get_all_templates(current_user: dict = Depends(admin_required)):
    """Get all content templates."""
    templates = await db.content_templates.find({}, {"_id": 0}).to_list(100)
    return templates


@router.post("/templates")
async def create_template(template_data: dict, current_user: dict = Depends(admin_required)):
    """Create a content template."""
    template = ContentTemplate(**template_data)
    template_dict = template.model_dump()
    template_dict['created_at'] = template_dict['created_at'].isoformat()
    template_dict['updated_at'] = template_dict['updated_at'].isoformat()
    
    await db.content_templates.insert_one(template_dict)
    return {"id": template.id, "message": "Template created successfully"}


@router.put("/templates/{template_id}")
async def update_template(template_id: str, template_data: dict, current_user: dict = Depends(admin_required)):
    """Update a template."""
    template_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.content_templates.update_one({"id": template_id}, {"$set": template_data})
    return {"message": "Template updated successfully"}


@router.delete("/templates/{template_id}")
async def delete_template(template_id: str, current_user: dict = Depends(admin_required)):
    """Delete a template."""
    await db.content_templates.delete_one({"id": template_id})
    return {"message": "Template deleted successfully"}


# ==================== DASHBOARD / OVERVIEW ====================

@router.get("/dashboard")
async def get_promotions_dashboard(current_user: dict = Depends(admin_required)):
    """Get promotions dashboard overview."""
    # ICPs
    total_icps = await db.icps.count_documents({})
    active_icps = await db.icps.count_documents({"is_active": True})
    
    # A/B Tests
    total_tests = await db.ab_tests.count_documents({})
    running_tests = await db.ab_tests.count_documents({"status": "running"})
    
    # Campaigns
    total_campaigns = await db.campaigns.count_documents({})
    active_campaigns = await db.campaigns.count_documents({"status": "active"})
    
    # Templates
    total_templates = await db.content_templates.count_documents({})
    
    return {
        "icps": {"total": total_icps, "active": active_icps},
        "ab_tests": {"total": total_tests, "running": running_tests},
        "campaigns": {"total": total_campaigns, "active": active_campaigns},
        "templates": {"total": total_templates}
    }


# ==================== SEED DEFAULTS ====================

async def seed_default_icps():
    """Seed default ICPs."""
    for icp_data in DEFAULT_ICPS:
        existing = await db.icps.find_one({"name": icp_data['name']})
        if not existing:
            icp = IdealCustomerProfile(**icp_data)
            icp_dict = icp.model_dump()
            icp_dict['created_at'] = icp_dict['created_at'].isoformat()
            icp_dict['updated_at'] = icp_dict['updated_at'].isoformat()
            await db.icps.insert_one(icp_dict)
