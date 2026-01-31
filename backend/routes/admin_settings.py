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


# ==================== SOCIAL LINKS ====================

@router.get("/social-links")
async def get_social_links(current_user: dict = Depends(admin_required)):
    """Get all social media links."""
    settings = await db.site_settings.find_one({}, {"_id": 0})
    if not settings:
        return {
            "instagram": "https://instagram.com/adverlyx",
            "twitter": "https://twitter.com/adverlyx",
            "linkedin": "https://linkedin.com/company/adverlyx",
            "youtube": "",
            "facebook": "",
            "tiktok": "",
            "pinterest": "",
            "discord": "",
            "telegram": ""
        }
    
    return {
        "instagram": settings.get("social_instagram", ""),
        "twitter": settings.get("social_twitter", ""),
        "linkedin": settings.get("social_linkedin", ""),
        "youtube": settings.get("social_youtube", ""),
        "facebook": settings.get("social_facebook", ""),
        "tiktok": settings.get("social_tiktok", ""),
        "pinterest": settings.get("social_pinterest", ""),
        "discord": settings.get("social_discord", ""),
        "telegram": settings.get("social_telegram", "")
    }


@router.put("/social-links")
async def update_social_links(links: dict, current_user: dict = Depends(admin_required)):
    """Update social media links."""
    update_data = {
        "social_instagram": links.get("instagram", ""),
        "social_twitter": links.get("twitter", ""),
        "social_linkedin": links.get("linkedin", ""),
        "social_youtube": links.get("youtube", ""),
        "social_facebook": links.get("facebook", ""),
        "social_tiktok": links.get("tiktok", ""),
        "social_pinterest": links.get("pinterest", ""),
        "social_discord": links.get("discord", ""),
        "social_telegram": links.get("telegram", ""),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.site_settings.update_one(
        {},
        {"$set": update_data},
        upsert=True
    )
    
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.SETTINGS_UPDATE,
        target_type="social_links",
        description="Updated social media links"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Social links updated successfully"}


# ==================== EMAIL (SMTP) SETTINGS ====================

class EmailSettingsRequest(BaseModel):
    smtp_host: str
    smtp_port: int = 465
    smtp_username: str
    smtp_password: str
    smtp_use_ssl: bool = True
    sender_email: str
    sender_name: str = "Adverlyx Digital"


@router.get("/email")
async def get_email_settings(current_user: dict = Depends(admin_required)):
    """Get email/SMTP settings (password masked)."""
    settings = await db.email_settings.find_one({}, {"_id": 0})
    if not settings:
        return {
            "smtp_host": "",
            "smtp_port": 465,
            "smtp_username": "",
            "smtp_password": "",
            "smtp_use_ssl": True,
            "sender_email": "",
            "sender_name": "Adverlyx Digital",
            "is_configured": False,
            "last_test_status": None,
            "last_test_at": None
        }
    
    # Mask password for security
    masked_password = ""
    if settings.get("smtp_password"):
        pwd_len = len(settings["smtp_password"])
        if pwd_len > 0:
            masked_password = "*" * min(pwd_len, 12)
    
    return {
        "smtp_host": settings.get("smtp_host", ""),
        "smtp_port": settings.get("smtp_port", 465),
        "smtp_username": settings.get("smtp_username", ""),
        "smtp_password": masked_password,
        "smtp_use_ssl": settings.get("smtp_use_ssl", True),
        "sender_email": settings.get("sender_email", ""),
        "sender_name": settings.get("sender_name", "Adverlyx Digital"),
        "is_configured": bool(settings.get("smtp_host") and settings.get("smtp_username")),
        "last_test_status": settings.get("last_test_status"),
        "last_test_at": settings.get("last_test_at")
    }


@router.put("/email")
async def update_email_settings(settings: EmailSettingsRequest, current_user: dict = Depends(admin_required)):
    """Update email/SMTP settings."""
    # Check if password is masked (not changed)
    existing = await db.email_settings.find_one({})
    password_to_save = settings.smtp_password
    
    # If password is all asterisks, keep the existing password
    if settings.smtp_password and all(c == '*' for c in settings.smtp_password):
        if existing and existing.get("smtp_password"):
            password_to_save = existing["smtp_password"]
        else:
            raise HTTPException(status_code=400, detail="Please provide a valid password")
    
    update_data = {
        "smtp_host": settings.smtp_host,
        "smtp_port": settings.smtp_port,
        "smtp_username": settings.smtp_username,
        "smtp_password": password_to_save,
        "smtp_use_ssl": settings.smtp_use_ssl,
        "sender_email": settings.sender_email,
        "sender_name": settings.sender_name,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": current_user['user_id']
    }
    
    await db.email_settings.update_one(
        {},
        {"$set": update_data},
        upsert=True
    )
    
    # Log the action
    log = AdminLog(
        admin_id=current_user['user_id'],
        admin_email=current_user['email'],
        action=AdminAction.SETTINGS_UPDATE,
        target_type="email_settings",
        description="Updated email/SMTP settings"
    )
    log_dict = log.model_dump()
    log_dict['created_at'] = log_dict['created_at'].isoformat()
    await db.admin_logs.insert_one(log_dict)
    
    return {"message": "Email settings updated successfully"}


@router.post("/email/test")
async def test_email_settings(test_email: str, current_user: dict = Depends(admin_required)):
    """Send a test email to verify SMTP settings."""
    import smtplib
    import ssl
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    
    settings = await db.email_settings.find_one({}, {"_id": 0})
    if not settings or not settings.get("smtp_host"):
        raise HTTPException(status_code=400, detail="Email settings not configured")
    
    try:
        # Create test message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Adverlyx Digital - SMTP Test Email"
        message["From"] = f"{settings.get('sender_name', 'Adverlyx')} <{settings.get('sender_email', settings['smtp_username'])}>"
        message["To"] = test_email
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 30px; border-radius: 16px;">
                <h1 style="color: white; margin: 0;">SMTP Test Successful!</h1>
            </div>
            <div style="max-width: 600px; margin: 20px auto; padding: 20px;">
                <p>This test email confirms that your email settings are configured correctly.</p>
                <p><strong>SMTP Host:</strong> {settings['smtp_host']}</p>
                <p><strong>SMTP Port:</strong> {settings['smtp_port']}</p>
                <p><strong>SSL Enabled:</strong> {'Yes' if settings.get('smtp_use_ssl', True) else 'No'}</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">Sent from Adverlyx Digital Admin Panel</p>
            </div>
        </body>
        </html>
        """
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        smtp_host = settings['smtp_host']
        smtp_port = settings['smtp_port']
        smtp_username = settings['smtp_username']
        smtp_password = settings['smtp_password']
        use_ssl = settings.get('smtp_use_ssl', True)
        sender_email = settings.get('sender_email', smtp_username)
        
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                server.login(smtp_username, smtp_password)
                server.sendmail(sender_email, test_email, message.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                server.sendmail(sender_email, test_email, message.as_string())
        
        # Update test status
        await db.email_settings.update_one(
            {},
            {"$set": {
                "last_test_status": "success",
                "last_test_at": datetime.now(timezone.utc).isoformat(),
                "last_test_email": test_email
            }}
        )
        
        return {"message": f"Test email sent successfully to {test_email}", "status": "success"}
        
    except smtplib.SMTPAuthenticationError as e:
        await db.email_settings.update_one(
            {},
            {"$set": {
                "last_test_status": "auth_failed",
                "last_test_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=400, detail=f"SMTP authentication failed: Invalid username or password")
    
    except smtplib.SMTPConnectError as e:
        await db.email_settings.update_one(
            {},
            {"$set": {
                "last_test_status": "connection_failed",
                "last_test_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=400, detail=f"Failed to connect to SMTP server: {str(e)}")
    
    except Exception as e:
        await db.email_settings.update_one(
            {},
            {"$set": {
                "last_test_status": "failed",
                "last_test_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        raise HTTPException(status_code=400, detail=f"Failed to send test email: {str(e)}")
