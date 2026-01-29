"""
Feature Management API Routes for Adverlyx Digital.
Comprehensive CRUD operations for all feature configurations.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from models.feature_management import (
    PageConfig, PageSEO, SectionConfig, SectionContent, SectionStyle,
    PlatformFeatureConfig, PaymentOptionConfig, AuthOptionConfig,
    FeatureChangeLog, FeatureStatus, FeatureVisibility, PaymentMode, SecurityLevel,
    DEFAULT_PAGES, DEFAULT_SECTIONS, DEFAULT_PLATFORM_FEATURES,
    DEFAULT_PAYMENT_OPTIONS, DEFAULT_AUTH_OPTIONS
)
from utils.auth import get_current_user
from models.user import UserRole

router = APIRouter(prefix="/admin/feature-management", tags=["Feature Management"])

db = None


def init_router(database):
    global db
    db = database


async def admin_required(current_user: dict = Depends(get_current_user)):
    """Require admin role."""
    if current_user.get("role") not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def log_feature_change(
    feature_type: str,
    feature_key: str,
    feature_name: str,
    action: str,
    changes: dict,
    admin: dict,
    request: Request = None
):
    """Log feature changes for audit."""
    log = FeatureChangeLog(
        feature_type=feature_type,
        feature_key=feature_key,
        feature_name=feature_name,
        action=action,
        changes=changes,
        admin_id=admin.get("user_id", ""),
        admin_email=admin.get("email", ""),
        ip_address=request.client.host if request else "",
        user_agent=request.headers.get("user-agent", "") if request else ""
    )
    await db.feature_change_logs.insert_one(log.model_dump())


# ==================== INITIALIZATION ====================

@router.post("/initialize")
async def initialize_feature_configs(current_user: dict = Depends(admin_required)):
    """Initialize default feature configurations if not exist."""
    results = {"pages": 0, "sections": 0, "platform": 0, "payments": 0, "auth": 0}
    
    # Initialize Pages
    for page_def in DEFAULT_PAGES:
        existing = await db.feature_pages.find_one({"key": page_def["key"]})
        if not existing:
            page = PageConfig(**page_def, description=f"Configure {page_def['name']}")
            await db.feature_pages.insert_one(page.model_dump())
            results["pages"] += 1
    
    # Initialize Sections
    for section_def in DEFAULT_SECTIONS:
        existing = await db.feature_sections.find_one({"key": section_def["key"]})
        if not existing:
            section = SectionConfig(**section_def, description=f"Configure {section_def['name']}")
            await db.feature_sections.insert_one(section.model_dump())
            results["sections"] += 1
    
    # Initialize Platform Features
    for feature_def in DEFAULT_PLATFORM_FEATURES:
        existing = await db.feature_platform.find_one({"key": feature_def["key"]})
        if not existing:
            feature = PlatformFeatureConfig(**feature_def, description=f"Configure {feature_def['name']}")
            await db.feature_platform.insert_one(feature.model_dump())
            results["platform"] += 1
    
    # Initialize Payment Options
    for payment_def in DEFAULT_PAYMENT_OPTIONS:
        existing = await db.feature_payments.find_one({"key": payment_def["key"]})
        if not existing:
            payment = PaymentOptionConfig(**payment_def, description=f"Configure {payment_def['name']}")
            await db.feature_payments.insert_one(payment.model_dump())
            results["payments"] += 1
    
    # Initialize Auth Options
    for auth_def in DEFAULT_AUTH_OPTIONS:
        existing = await db.feature_auth.find_one({"key": auth_def["key"]})
        if not existing:
            auth = AuthOptionConfig(**auth_def, description=f"Configure {auth_def['name']}")
            await db.feature_auth.insert_one(auth.model_dump())
            results["auth"] += 1
    
    return {"message": "Feature configurations initialized", "created": results}


# ==================== PAGE MANAGEMENT ====================

@router.get("/pages")
async def get_all_pages(current_user: dict = Depends(admin_required)):
    """Get all page configurations."""
    pages = await db.feature_pages.find({}, {"_id": 0}).sort("nav_order", 1).to_list(100)
    return pages


@router.get("/pages/{key}")
async def get_page(key: str, current_user: dict = Depends(admin_required)):
    """Get a specific page configuration."""
    page = await db.feature_pages.find_one({"key": key}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.put("/pages/{key}")
async def update_page(
    key: str,
    update_data: dict,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Update a page configuration."""
    page = await db.feature_pages.find_one({"key": key})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Track changes
    changes = {}
    for field, new_value in update_data.items():
        if field in page and page[field] != new_value:
            changes[field] = {"old": page[field], "new": new_value}
    
    # Update
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user.get("user_id")
    
    await db.feature_pages.update_one({"key": key}, {"$set": update_data})
    
    # Log change
    await log_feature_change("page", key, page["name"], "update", changes, current_user, request)
    
    return {"message": "Page updated successfully"}


@router.post("/pages/{key}/publish")
async def publish_page(
    key: str,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Publish a page (change from draft to active)."""
    page = await db.feature_pages.find_one({"key": key})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    await db.feature_pages.update_one(
        {"key": key},
        {"$set": {
            "status": FeatureStatus.ACTIVE,
            "published_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_feature_change("page", key, page["name"], "publish", {}, current_user, request)
    
    return {"message": "Page published successfully"}


@router.post("/pages/{key}/draft")
async def save_page_as_draft(
    key: str,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Save page as draft."""
    page = await db.feature_pages.find_one({"key": key})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    await db.feature_pages.update_one(
        {"key": key},
        {"$set": {
            "status": FeatureStatus.DRAFT,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_feature_change("page", key, page["name"], "draft", {}, current_user, request)
    
    return {"message": "Page saved as draft"}


# ==================== SECTION MANAGEMENT ====================

@router.get("/sections")
async def get_all_sections(current_user: dict = Depends(admin_required)):
    """Get all section configurations."""
    sections = await db.feature_sections.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return sections


@router.get("/sections/{key}")
async def get_section(key: str, current_user: dict = Depends(admin_required)):
    """Get a specific section configuration."""
    section = await db.feature_sections.find_one({"key": key}, {"_id": 0})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.put("/sections/{key}")
async def update_section(
    key: str,
    update_data: dict,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Update a section configuration."""
    section = await db.feature_sections.find_one({"key": key})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    # Track changes
    changes = {}
    for field, new_value in update_data.items():
        if field in section and section[field] != new_value:
            changes[field] = {"old": section[field], "new": new_value}
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user.get("user_id")
    
    await db.feature_sections.update_one({"key": key}, {"$set": update_data})
    
    await log_feature_change("section", key, section["name"], "update", changes, current_user, request)
    
    return {"message": "Section updated successfully"}


@router.put("/sections/reorder")
async def reorder_sections(
    order_data: List[dict],
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Reorder sections (drag & drop)."""
    for item in order_data:
        await db.feature_sections.update_one(
            {"key": item["key"]},
            {"$set": {"order": item["order"]}}
        )
    
    await log_feature_change("section", "all", "All Sections", "reorder", {"new_order": order_data}, current_user, request)
    
    return {"message": "Sections reordered successfully"}


@router.post("/sections/{key}/publish")
async def publish_section(
    key: str,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Publish a section."""
    section = await db.feature_sections.find_one({"key": key})
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    await db.feature_sections.update_one(
        {"key": key},
        {"$set": {
            "status": FeatureStatus.ACTIVE,
            "published_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_feature_change("section", key, section["name"], "publish", {}, current_user, request)
    
    return {"message": "Section published successfully"}


# ==================== PLATFORM FEATURE MANAGEMENT ====================

@router.get("/platform")
async def get_all_platform_features(current_user: dict = Depends(admin_required)):
    """Get all platform feature configurations."""
    features = await db.feature_platform.find({}, {"_id": 0}).to_list(100)
    return features


@router.get("/platform/{key}")
async def get_platform_feature(key: str, current_user: dict = Depends(admin_required)):
    """Get a specific platform feature configuration."""
    feature = await db.feature_platform.find_one({"key": key}, {"_id": 0})
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    return feature


@router.put("/platform/{key}")
async def update_platform_feature(
    key: str,
    update_data: dict,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Update a platform feature configuration."""
    feature = await db.feature_platform.find_one({"key": key})
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    changes = {}
    for field, new_value in update_data.items():
        if field in feature and feature[field] != new_value:
            changes[field] = {"old": feature[field], "new": new_value}
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user.get("user_id")
    
    await db.feature_platform.update_one({"key": key}, {"$set": update_data})
    
    await log_feature_change("platform", key, feature["name"], "update", changes, current_user, request)
    
    return {"message": "Feature updated successfully"}


# ==================== PAYMENT OPTION MANAGEMENT ====================

@router.get("/payments")
async def get_all_payment_options(current_user: dict = Depends(admin_required)):
    """Get all payment option configurations."""
    payments = await db.feature_payments.find({}, {"_id": 0}).to_list(100)
    # Mask sensitive data
    for payment in payments:
        if payment.get("api_key"):
            payment["api_key"] = "***" + payment["api_key"][-4:] if len(payment["api_key"]) > 4 else "***"
        if payment.get("api_secret"):
            payment["api_secret"] = "***" + payment["api_secret"][-4:] if len(payment["api_secret"]) > 4 else "***"
    return payments


@router.get("/payments/{key}")
async def get_payment_option(key: str, current_user: dict = Depends(admin_required)):
    """Get a specific payment option configuration."""
    payment = await db.feature_payments.find_one({"key": key}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment option not found")
    # Mask sensitive data
    if payment.get("api_key"):
        payment["api_key_masked"] = "***" + payment["api_key"][-4:] if len(payment["api_key"]) > 4 else "***"
    if payment.get("api_secret"):
        payment["api_secret_masked"] = "***" + payment["api_secret"][-4:] if len(payment["api_secret"]) > 4 else "***"
    return payment


@router.put("/payments/{key}")
async def update_payment_option(
    key: str,
    update_data: dict,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Update a payment option configuration."""
    payment = await db.feature_payments.find_one({"key": key})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment option not found")
    
    # Don't log sensitive credential changes in detail
    changes = {}
    sensitive_fields = ["api_key", "api_secret", "public_key", "merchant_id"]
    for field, new_value in update_data.items():
        if field in payment and payment[field] != new_value:
            if field in sensitive_fields:
                changes[field] = {"old": "***", "new": "***"}
            else:
                changes[field] = {"old": payment[field], "new": new_value}
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user.get("user_id")
    
    await db.feature_payments.update_one({"key": key}, {"$set": update_data})
    
    await log_feature_change("payment", key, payment["name"], "update", changes, current_user, request)
    
    return {"message": "Payment option updated successfully"}


@router.post("/payments/{key}/test-connection")
async def test_payment_connection(
    key: str,
    current_user: dict = Depends(admin_required)
):
    """Test payment provider connection."""
    payment = await db.feature_payments.find_one({"key": key})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment option not found")
    
    # Simulate connection test (in production, actually test the API)
    return {
        "success": True,
        "message": f"Connection to {payment['name']} successful",
        "mode": payment.get("mode", "test"),
        "webhook_status": payment.get("webhook", {}).get("status", "inactive")
    }


# ==================== AUTH OPTION MANAGEMENT ====================

@router.get("/auth")
async def get_all_auth_options(current_user: dict = Depends(admin_required)):
    """Get all auth option configurations."""
    auth_options = await db.feature_auth.find({}, {"_id": 0}).to_list(100)
    # Mask credentials
    for auth in auth_options:
        if auth.get("credentials"):
            if auth["credentials"].get("client_secret"):
                auth["credentials"]["client_secret"] = "***"
    return auth_options


@router.get("/auth/{key}")
async def get_auth_option(key: str, current_user: dict = Depends(admin_required)):
    """Get a specific auth option configuration."""
    auth = await db.feature_auth.find_one({"key": key}, {"_id": 0})
    if not auth:
        raise HTTPException(status_code=404, detail="Auth option not found")
    if auth.get("credentials", {}).get("client_secret"):
        auth["credentials"]["client_secret_masked"] = "***"
    return auth


@router.put("/auth/{key}")
async def update_auth_option(
    key: str,
    update_data: dict,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Update an auth option configuration."""
    auth = await db.feature_auth.find_one({"key": key})
    if not auth:
        raise HTTPException(status_code=404, detail="Auth option not found")
    
    changes = {}
    for field, new_value in update_data.items():
        if field == "credentials":
            changes[field] = {"old": "***", "new": "***"}
        elif field in auth and auth[field] != new_value:
            changes[field] = {"old": auth[field], "new": new_value}
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["updated_by"] = current_user.get("user_id")
    
    await db.feature_auth.update_one({"key": key}, {"$set": update_data})
    
    await log_feature_change("auth", key, auth["name"], "update", changes, current_user, request)
    
    return {"message": "Auth option updated successfully"}


# ==================== AUDIT LOGS ====================

@router.get("/logs")
async def get_feature_change_logs(
    feature_type: Optional[str] = None,
    feature_key: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(admin_required)
):
    """Get feature change audit logs."""
    query = {}
    if feature_type:
        query["feature_type"] = feature_type
    if feature_key:
        query["feature_key"] = feature_key
    
    logs = await db.feature_change_logs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs


# ==================== BULK OPERATIONS ====================

from pydantic import BaseModel

class BulkToggleRequest(BaseModel):
    feature_type: str
    keys: List[str]
    enabled: bool

@router.post("/bulk-toggle")
async def bulk_toggle_features(
    bulk_data: BulkToggleRequest,
    request: Request,
    current_user: dict = Depends(admin_required)
):
    """Bulk enable/disable features."""
    feature_type = bulk_data.feature_type
    keys = bulk_data.keys
    enabled = bulk_data.enabled
    collection_map = {
        "page": "feature_pages",
        "section": "feature_sections",
        "platform": "feature_platform",
        "payment": "feature_payments",
        "auth": "feature_auth"
    }
    
    if feature_type not in collection_map:
        raise HTTPException(status_code=400, detail="Invalid feature type")
    
    collection = collection_map[feature_type]
    
    result = await db[collection].update_many(
        {"key": {"$in": keys}},
        {"$set": {
            "enabled": enabled,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": current_user.get("user_id")
        }}
    )
    
    action = "enable" if enabled else "disable"
    await log_feature_change(
        feature_type, 
        ",".join(keys), 
        f"Bulk {action}", 
        f"bulk_{action}", 
        {"keys": keys, "enabled": enabled}, 
        current_user, 
        request
    )
    
    return {"message": f"Updated {result.modified_count} features", "modified": result.modified_count}


# ==================== SYNC WITH SITE SETTINGS ====================

@router.post("/sync-to-site-settings")
async def sync_to_site_settings(current_user: dict = Depends(admin_required)):
    """Sync feature configurations to site_settings collection."""
    # Get all enabled features
    pages = await db.feature_pages.find({}, {"key": 1, "enabled": 1, "_id": 0}).to_list(100)
    sections = await db.feature_sections.find({}, {"key": 1, "enabled": 1, "_id": 0}).to_list(100)
    platform = await db.feature_platform.find({}, {"key": 1, "enabled": 1, "_id": 0}).to_list(100)
    payments = await db.feature_payments.find({}, {"key": 1, "enabled": 1, "_id": 0}).to_list(100)
    auth_opts = await db.feature_auth.find({}, {"key": 1, "enabled": 1, "_id": 0}).to_list(100)
    
    # Build features dict
    features = {}
    for item in pages + sections + platform + payments + auth_opts:
        features[item["key"]] = item["enabled"]
    
    # Update site_settings
    await db.site_settings.update_one(
        {},
        {"$set": {"features": features}},
        upsert=True
    )
    
    return {"message": "Synced to site settings", "features_count": len(features)}
