"""
Admin Email Template Customization for Adverlyx Digital.
Allows admins to customize email templates via the admin panel.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid

from utils.auth import get_current_user, require_roles
from models.user import UserRole

router = APIRouter(prefix="/admin/email-templates", tags=["Admin Email Templates"])

db = None

def init_router(database):
    global db
    db = database


admin_required = require_roles([UserRole.ADMIN, UserRole.MANAGER])


# ==================== MODELS ====================

class EmailTemplateCreate(BaseModel):
    key: str  # e.g., "welcome", "payment_confirmation", "password_reset"
    name: str
    subject: str
    html_content: str
    variables: List[str] = []  # e.g., ["name", "plan", "amount"]
    enabled: bool = True


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    html_content: Optional[str] = None
    variables: Optional[List[str]] = None
    enabled: Optional[bool] = None


# Default email templates
DEFAULT_TEMPLATES = [
    {
        "key": "welcome",
        "name": "Welcome Email",
        "subject": "Welcome to {{brand_name}}!",
        "variables": ["name", "brand_name"],
        "html_content": """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: {{bg_color}}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {{bg_color}}; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: {{gradient}}; padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to {{brand_name}}!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi {{name}},</p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Welcome to {{brand_name}}! We're excited to help you grow your Instagram presence.</p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Get started by choosing a plan and connecting your Instagram account.</p>
                            <div style="text-align: center;">
                                <a href="{{dashboard_url}}" style="display: inline-block; background: {{gradient}}; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {{brand_name}}. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    },
    {
        "key": "payment_confirmation",
        "name": "Payment Confirmation",
        "subject": "Payment Confirmed - {{brand_name}}",
        "variables": ["name", "plan", "amount", "billing", "brand_name"],
        "html_content": """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: {{bg_color}}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {{bg_color}}; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ Payment Confirmed!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {{name}},</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Your payment has been processed successfully.</p>
                            <table width="100%" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 30px;">
                                <tr><td style="padding: 24px;">
                                    <p style="margin: 8px 0;"><strong>Plan:</strong> {{plan}}</p>
                                    <p style="margin: 8px 0;"><strong>Billing:</strong> {{billing}}</p>
                                    <p style="margin: 8px 0; font-size: 20px; color: #22c55e;"><strong>Amount:</strong> ${{amount}}</p>
                                </td></tr>
                            </table>
                            <div style="text-align: center;">
                                <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">View Dashboard</a>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {{brand_name}}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    },
    {
        "key": "password_reset",
        "name": "Password Reset",
        "subject": "Reset Your Password - {{brand_name}}",
        "variables": ["name", "reset_url", "brand_name"],
        "html_content": """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: {{bg_color}}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {{bg_color}}; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: {{gradient}}; padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Reset Your Password</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {{name}},</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">We received a request to reset your password. Click the button below to create a new password.</p>
                            <div style="text-align: center; margin-bottom: 30px;">
                                <a href="{{reset_url}}" style="display: inline-block; background: {{gradient}}; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Reset Password</a>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {{brand_name}}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    },
    {
        "key": "subscription_update",
        "name": "Subscription Update",
        "subject": "Subscription Update - {{brand_name}}",
        "variables": ["name", "plan", "billing", "action", "brand_name"],
        "html_content": """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: {{bg_color}}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {{bg_color}}; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6, #ec4899); padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Subscription Update</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {{name}},</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">{{action_message}}</p>
                            <table width="100%" style="background-color: #f9fafb; border-radius: 12px;">
                                <tr><td style="padding: 24px;">
                                    <p style="margin: 8px 0;"><strong>Plan:</strong> {{plan}}</p>
                                    <p style="margin: 8px 0;"><strong>Billing:</strong> {{billing}}</p>
                                </td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {{brand_name}}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    },
    {
        "key": "payment_failed",
        "name": "Payment Failed",
        "subject": "Action Required: Payment Failed - {{brand_name}}",
        "variables": ["name", "brand_name", "update_payment_url"],
        "html_content": """
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: {{bg_color}}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: {{bg_color}}; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⚠️ Payment Failed</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {{name}},</p>
                            <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">We were unable to process your recent payment. Please update your payment method to continue using {{brand_name}}.</p>
                            <div style="text-align: center; margin-bottom: 30px;">
                                <a href="{{update_payment_url}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Update Payment Method</a>
                            </div>
                            <p style="color: #6b7280; font-size: 14px;">If you believe this is an error, please contact our support team.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {{brand_name}}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    }
]


# ==================== ROUTES ====================

@router.post("/initialize")
async def initialize_email_templates(current_user: dict = Depends(admin_required)):
    """Initialize default email templates if not exist."""
    created = 0
    for template in DEFAULT_TEMPLATES:
        existing = await db.email_templates.find_one({"key": template["key"]})
        if not existing:
            template_doc = {
                **template,
                "id": str(uuid.uuid4()),
                "enabled": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.email_templates.insert_one(template_doc)
            created += 1
    
    return {"message": f"Initialized {created} email templates", "created": created}


@router.get("/")
async def get_all_templates(current_user: dict = Depends(admin_required)):
    """Get all email templates."""
    templates = await db.email_templates.find({}, {"_id": 0}).to_list(100)
    return templates


@router.get("/{key}")
async def get_template(key: str, current_user: dict = Depends(admin_required)):
    """Get a specific email template."""
    template = await db.email_templates.find_one({"key": key}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{key}")
async def update_template(
    key: str,
    update_data: EmailTemplateUpdate,
    current_user: dict = Depends(admin_required)
):
    """Update an email template."""
    template = await db.email_templates.find_one({"key": key})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["updated_by"] = current_user.get("user_id")
    
    await db.email_templates.update_one({"key": key}, {"$set": update_dict})
    
    return {"message": "Template updated successfully"}


@router.post("/{key}/preview")
async def preview_template(
    key: str,
    preview_data: dict,
    current_user: dict = Depends(admin_required)
):
    """Generate a preview of the email template with sample data."""
    template = await db.email_templates.find_one({"key": key}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Get branding settings
    settings = await db.site_settings.find_one({}, {"_id": 0})
    branding = settings.get("branding", {}) if settings else {}
    
    # Default preview values
    defaults = {
        "name": "John Doe",
        "plan": "Pro",
        "amount": "69.00",
        "billing": "Monthly",
        "brand_name": branding.get("site_name", "Adverlyx Digital"),
        "gradient": f"linear-gradient(135deg, {branding.get('primary_color', '#f97316')}, {branding.get('secondary_color', '#ec4899')})",
        "bg_color": "#f4f4f5",
        "dashboard_url": "https://adverlyx.com/dashboard",
        "reset_url": "https://adverlyx.com/reset-password?token=sample",
        "update_payment_url": "https://adverlyx.com/billing",
        "action_message": "Your subscription has been updated."
    }
    
    # Merge with provided data
    data = {**defaults, **preview_data}
    
    # Replace variables in content
    subject = template["subject"]
    html = template["html_content"]
    
    for key_var, value in data.items():
        subject = subject.replace(f"{{{{{key_var}}}}}", str(value))
        html = html.replace(f"{{{{{key_var}}}}}", str(value))
    
    return {
        "subject": subject,
        "html_content": html,
        "variables": template.get("variables", [])
    }


@router.post("/{key}/test-send")
async def test_send_template(
    key: str,
    test_email: str,
    current_user: dict = Depends(admin_required)
):
    """Send a test email using the template."""
    from utils.email import send_email
    
    # Get preview
    preview = await preview_template(key, {}, current_user)
    
    # Send test email
    result = await send_email(test_email, preview["subject"], preview["html_content"])
    
    if result:
        return {"message": f"Test email sent to {test_email}", "email_id": result}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")


@router.post("/{key}/reset")
async def reset_template(key: str, current_user: dict = Depends(admin_required)):
    """Reset a template to its default content."""
    # Find default template
    default_template = None
    for t in DEFAULT_TEMPLATES:
        if t["key"] == key:
            default_template = t
            break
    
    if not default_template:
        raise HTTPException(status_code=404, detail="Default template not found")
    
    # Update to default
    await db.email_templates.update_one(
        {"key": key},
        {"$set": {
            "subject": default_template["subject"],
            "html_content": default_template["html_content"],
            "variables": default_template["variables"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "reset_by": current_user.get("user_id")
        }}
    )
    
    return {"message": "Template reset to default"}
