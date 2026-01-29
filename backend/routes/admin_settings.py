from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel

from models.settings import (
    SiteSettings, BrandingSettings, UISettings, FeatureToggle,
    HeroContent, StatsContent, PromoBanner, PageContent
)
from models.admin_log import AdminLog, AdminAction
from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])

db = None

def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# ==================== SITE SETTINGS ====================

@router.get("/", response_model=dict)
async def get_all_settings(current_user: dict = Depends(admin_required)):
    """Get all site settings."""
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        # Return defaults
        default = SiteSettings()
        return default.model_dump()
    return settings


@router.put("/")
async def update_all_settings(settings: dict, current_user: dict = Depends(admin_required)):
    """Update all site settings at once."""
    settings['updated_at'] = datetime.now(timezone.utc).isoformat()
    settings['updated_by'] = current_user['user_id']
    
    await db.site_settings.update_one(
        {},
        {"$set": settings},
        upsert=True
    )
    
    # Log action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.SETTINGS_UPDATE,
        target_type="site_settings",
        description="Updated site settings"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Settings updated successfully"}


# ==================== BRANDING ====================

@router.get("/branding")
async def get_branding(current_user: dict = Depends(admin_required)):
    """Get branding settings."""
    settings = await db.site_settings.find_one({}, {"branding": 1, "_id": 0})
    if settings and settings.get('branding'):
        return settings['branding']
    return BrandingSettings().model_dump()


@router.put("/branding")
async def update_branding(branding: dict, current_user: dict = Depends(admin_required)):
    """Update branding settings."""
    branding['updated_at'] = datetime.now(timezone.utc).isoformat()
    branding['updated_by'] = current_user['user_id']
    
    await db.site_settings.update_one(
        {},
        {"$set": {"branding": branding, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.SETTINGS_UPDATE,
        target_type="branding",
        description="Updated branding settings"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Branding updated successfully"}


# ==================== UI SETTINGS ====================

@router.get("/ui")
async def get_ui_settings(current_user: dict = Depends(admin_required)):
    """Get UI settings."""
    settings = await db.site_settings.find_one({}, {"ui": 1, "_id": 0})
    if settings and settings.get('ui'):
        return settings['ui']
    return UISettings().model_dump()


@router.put("/ui")
async def update_ui_settings(ui: dict, current_user: dict = Depends(admin_required)):
    """Update UI settings."""
    ui['updated_at'] = datetime.now(timezone.utc).isoformat()
    ui['updated_by'] = current_user['user_id']
    
    await db.site_settings.update_one(
        {},
        {"$set": {"ui": ui, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "UI settings updated successfully"}


# ==================== FEATURE TOGGLES ====================

@router.get("/features")
async def get_feature_toggles(current_user: dict = Depends(admin_required)):
    """Get feature toggles."""
    settings = await db.site_settings.find_one({}, {"features": 1, "_id": 0})
    if settings and settings.get('features'):
        return settings['features']
    return FeatureToggle().model_dump()


@router.put("/features")
async def update_feature_toggles(features: dict, current_user: dict = Depends(admin_required)):
    """Update feature toggles."""
    features['updated_at'] = datetime.now(timezone.utc).isoformat()
    features['updated_by'] = current_user['user_id']
    
    await db.site_settings.update_one(
        {},
        {"$set": {"features": features, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Feature toggles updated successfully"}


@router.put("/features/{feature_key}")
async def toggle_single_feature(feature_key: str, enabled: bool, current_user: dict = Depends(admin_required)):
    """Toggle a single feature on/off."""
    await db.site_settings.update_one(
        {},
        {
            "$set": {
                f"features.{feature_key}": enabled,
                "features.updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"message": f"Feature {feature_key} {'enabled' if enabled else 'disabled'}"}


# ==================== HERO CONTENT ====================

@router.get("/hero")
async def get_hero_content(current_user: dict = Depends(admin_required)):
    """Get hero section content."""
    settings = await db.site_settings.find_one({}, {"hero": 1, "_id": 0})
    if settings and settings.get('hero'):
        return settings['hero']
    return HeroContent().model_dump()


@router.put("/hero")
async def update_hero_content(hero: dict, current_user: dict = Depends(admin_required)):
    """Update hero section content."""
    await db.site_settings.update_one(
        {},
        {"$set": {"hero": hero, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Hero content updated successfully"}


# ==================== STATS ====================

@router.get("/stats")
async def get_stats_content(current_user: dict = Depends(admin_required)):
    """Get stats content."""
    settings = await db.site_settings.find_one({}, {"stats": 1, "_id": 0})
    if settings and settings.get('stats'):
        return settings['stats']
    return StatsContent().model_dump()


@router.put("/stats")
async def update_stats_content(stats: dict, current_user: dict = Depends(admin_required)):
    """Update stats content."""
    await db.site_settings.update_one(
        {},
        {"$set": {"stats": stats, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Stats updated successfully"}


# ==================== PROMO BANNER ====================

@router.get("/promo-banner")
async def get_promo_banner(current_user: dict = Depends(admin_required)):
    """Get promo banner settings."""
    settings = await db.site_settings.find_one({}, {"promo_banner": 1, "_id": 0})
    if settings and settings.get('promo_banner'):
        return settings['promo_banner']
    return PromoBanner().model_dump()


@router.put("/promo-banner")
async def update_promo_banner(banner: dict, current_user: dict = Depends(admin_required)):
    """Update promo banner settings."""
    await db.site_settings.update_one(
        {},
        {"$set": {"promo_banner": banner, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Promo banner updated successfully"}


# ==================== PAGE CONTENT (CMS) ====================

@router.get("/content")
async def get_all_page_content(current_user: dict = Depends(admin_required)):
    """Get all page content."""
    content = await db.page_content.find({}, {"_id": 0}).to_list(1000)
    return content


@router.get("/content/{page_key}")
async def get_page_content(page_key: str, current_user: dict = Depends(admin_required)):
    """Get content for a specific page."""
    content = await db.page_content.find({"page_key": page_key}, {"_id": 0}).to_list(100)
    return content


@router.post("/content")
async def create_page_content(content: dict, current_user: dict = Depends(admin_required)):
    """Create new page content."""
    import uuid
    content['id'] = str(uuid.uuid4())
    content['created_at'] = datetime.now(timezone.utc).isoformat()
    content['updated_at'] = datetime.now(timezone.utc).isoformat()
    content['updated_by'] = current_user['user_id']
    
    await db.page_content.insert_one(content)
    return {"message": "Content created", "id": content['id']}


@router.put("/content/{content_id}")
async def update_page_content(content_id: str, content: dict, current_user: dict = Depends(admin_required)):
    """Update page content."""
    content['updated_at'] = datetime.now(timezone.utc).isoformat()
    content['updated_by'] = current_user['user_id']
    
    await db.page_content.update_one(
        {"id": content_id},
        {"$set": content}
    )
    return {"message": "Content updated"}


@router.delete("/content/{content_id}")
async def delete_page_content(content_id: str, current_user: dict = Depends(admin_required)):
    """Delete page content."""
    await db.page_content.delete_one({"id": content_id})
    return {"message": "Content deleted"}


# ==================== TESTIMONIALS ====================

@router.get("/testimonials")
async def get_testimonials(current_user: dict = Depends(admin_required)):
    """Get all testimonials."""
    testimonials = await db.testimonials.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return testimonials


@router.post("/testimonials")
async def create_testimonial(testimonial: dict, current_user: dict = Depends(admin_required)):
    """Create new testimonial."""
    import uuid
    testimonial['id'] = str(uuid.uuid4())
    testimonial['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.testimonials.insert_one(testimonial)
    return {"message": "Testimonial created", "id": testimonial['id']}


@router.put("/testimonials/{testimonial_id}")
async def update_testimonial(testimonial_id: str, testimonial: dict, current_user: dict = Depends(admin_required)):
    """Update testimonial."""
    testimonial['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.testimonials.update_one(
        {"id": testimonial_id},
        {"$set": testimonial}
    )
    return {"message": "Testimonial updated"}


@router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, current_user: dict = Depends(admin_required)):
    """Delete testimonial."""
    await db.testimonials.delete_one({"id": testimonial_id})
    return {"message": "Testimonial deleted"}


# ==================== FAQs ====================

@router.get("/faqs")
async def get_faqs(current_user: dict = Depends(admin_required)):
    """Get all FAQs."""
    faqs = await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return faqs


@router.post("/faqs")
async def create_faq(faq: dict, current_user: dict = Depends(admin_required)):
    """Create new FAQ."""
    import uuid
    faq['id'] = str(uuid.uuid4())
    faq['created_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.faqs.insert_one(faq)
    return {"message": "FAQ created", "id": faq['id']}


@router.put("/faqs/{faq_id}")
async def update_faq(faq_id: str, faq: dict, current_user: dict = Depends(admin_required)):
    """Update FAQ."""
    faq['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.faqs.update_one(
        {"id": faq_id},
        {"$set": faq}
    )
    return {"message": "FAQ updated"}


@router.delete("/faqs/{faq_id}")
async def delete_faq(faq_id: str, current_user: dict = Depends(admin_required)):
    """Delete FAQ."""
    await db.faqs.delete_one({"id": faq_id})
    return {"message": "FAQ deleted"}
