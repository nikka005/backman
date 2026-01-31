import os
import asyncio
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Email configuration
BRAND_NAME = "Adverlyx Digital"

# Fallback SMTP Configuration from environment (used if DB not configured)
ENV_SMTP_HOST = os.environ.get("SMTP_HOST", "")
ENV_SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
ENV_SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
ENV_SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
ENV_SMTP_USE_SSL = os.environ.get("SMTP_USE_SSL", "true").lower() == "true"
ENV_SENDER_EMAIL = os.environ.get("SENDER_EMAIL", ENV_SMTP_USERNAME)
ENV_SENDER_NAME = os.environ.get("SENDER_NAME", BRAND_NAME)

# Fallback to Resend if SMTP not configured
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")

# Initialize email service
email_service = None
email_service_type = None

# Database reference (will be set by init_email_db)
_db = None

def init_email_db(database):
    """Initialize database reference for email settings."""
    global _db
    _db = database
    logger.info("Email service database initialized")


async def get_email_config():
    """Get email configuration from database, fallback to environment."""
    # Try to get settings from database first
    if _db is not None:
        try:
            settings = await _db.email_settings.find_one({}, {"_id": 0})
            if settings and settings.get("smtp_host") and settings.get("smtp_username"):
                return {
                    "smtp_host": settings.get("smtp_host"),
                    "smtp_port": settings.get("smtp_port", 465),
                    "smtp_username": settings.get("smtp_username"),
                    "smtp_password": settings.get("smtp_password"),
                    "smtp_use_ssl": settings.get("smtp_use_ssl", True),
                    "sender_email": settings.get("sender_email") or settings.get("smtp_username"),
                    "sender_name": settings.get("sender_name", BRAND_NAME),
                    "source": "database"
                }
        except Exception as e:
            logger.warning(f"Failed to get email settings from DB: {e}")
    
    # Fallback to environment variables
    if ENV_SMTP_HOST and ENV_SMTP_USERNAME:
        return {
            "smtp_host": ENV_SMTP_HOST,
            "smtp_port": ENV_SMTP_PORT,
            "smtp_username": ENV_SMTP_USERNAME,
            "smtp_password": ENV_SMTP_PASSWORD,
            "smtp_use_ssl": ENV_SMTP_USE_SSL,
            "sender_email": ENV_SENDER_EMAIL,
            "sender_name": ENV_SENDER_NAME,
            "source": "environment"
        }
    
    return None


def init_email_service():
    global email_service, email_service_type
    
    # Check if SMTP is configured via environment (for initial setup)
    if ENV_SMTP_HOST and ENV_SMTP_USERNAME and ENV_SMTP_PASSWORD:
        email_service_type = "smtp"
        logger.info(f"SMTP email service configured from env: {ENV_SMTP_HOST}:{ENV_SMTP_PORT}")
        return True
    
    # Fallback to Resend
    if RESEND_API_KEY:
        try:
            import resend
            resend.api_key = RESEND_API_KEY
            email_service = resend
            email_service_type = "resend"
            logger.info("Resend email service initialized")
            return True
        except ImportError:
            logger.warning("Resend package not installed")
    
    # Mark as potentially configured via database
    email_service_type = "smtp_db"
    logger.info("Email service will use database configuration")
    return True

# Initialize on module load
init_email_service()


async def send_email_smtp(to_email: str, subject: str, html_content: str) -> Optional[str]:
    """Send email using SMTP (from DB or environment)."""
    try:
        # Get configuration
        config = await get_email_config()
        if not config:
            logger.warning("No SMTP configuration available")
            return None
        
        smtp_host = config["smtp_host"]
        smtp_port = config["smtp_port"]
        smtp_username = config["smtp_username"]
        smtp_password = config["smtp_password"]
        smtp_use_ssl = config["smtp_use_ssl"]
        sender_email = config["sender_email"]
        sender_name = config["sender_name"]
        
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{sender_name} <{sender_email}>"
        message["To"] = to_email
        
        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        # Send email
        def _send():
            if smtp_use_ssl:
                # SSL connection (port 465)
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
                    server.login(smtp_username, smtp_password)
                    server.sendmail(sender_email, to_email, message.as_string())
            else:
                # TLS connection (port 587)
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_username, smtp_password)
                    server.sendmail(sender_email, to_email, message.as_string())
            return True
        
        # Run in thread to not block async
        result = await asyncio.to_thread(_send)
        if result:
            logger.info(f"Email sent via SMTP ({config['source']}) to {to_email}")
            return f"smtp_{to_email}"
        return None
        
    except Exception as e:
        logger.error(f"SMTP email failed to {to_email}: {str(e)}")
        return None


async def send_email_resend(to_email: str, subject: str, html_content: str) -> Optional[str]:
    """Send email using Resend."""
    if not email_service:
        return None
    
    params = {
        "from": f"{SENDER_NAME} <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(email_service.Emails.send, params)
        logger.info(f"Email sent via Resend to {to_email}: {email.get('id')}")
        return email.get("id")
    except Exception as e:
        logger.error(f"Resend email failed to {to_email}: {str(e)}")
        return None


async def send_email(to_email: str, subject: str, html_content: str) -> Optional[str]:
    """Send an email using configured service. Returns email ID on success, None on failure."""
    # Always try SMTP first (from DB or env)
    config = await get_email_config()
    if config:
        return await send_email_smtp(to_email, subject, html_content)
    
    # Fallback to Resend if configured
    if email_service_type == "resend":
        return await send_email_resend(to_email, subject, html_content)
    
    logger.warning("Email service not configured, skipping email send")
    return None


async def is_email_configured() -> bool:
    """Check if email service is configured."""
    config = await get_email_config()
    return config is not None or email_service_type == "resend"


async def get_email_service_status() -> dict:
    """Get current email service status."""
    config = await get_email_config()
    if config:
        return {
            "configured": True,
            "service_type": "smtp",
            "source": config.get("source", "unknown"),
            "sender_email": config.get("sender_email"),
            "sender_name": config.get("sender_name"),
            "smtp_host": config.get("smtp_host")
        }
    
    if email_service_type == "resend":
        return {
            "configured": True,
            "service_type": "resend",
            "source": "environment",
            "sender_email": ENV_SENDER_EMAIL,
            "sender_name": ENV_SENDER_NAME,
            "smtp_host": None
        }
    
    return {
        "configured": False,
        "service_type": None,
        "source": None,
        "sender_email": None,
        "sender_name": None,
        "smtp_host": None
    }


# ==================== EMAIL TEMPLATES ====================

def get_welcome_email_html(name: str) -> str:
    """Generate welcome email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to {BRAND_NAME}!</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Thank you for joining {BRAND_NAME}! We're excited to help you grow your Instagram presence.</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Here's what you can do next:</p>
                                <ul style="color: #374151; font-size: 16px; margin: 0 0 30px; padding-left: 20px;">
                                    <li style="margin-bottom: 10px;">Connect your Instagram account</li>
                                    <li style="margin-bottom: 10px;">Set up your targeting preferences</li>
                                    <li style="margin-bottom: 10px;">Choose a plan that fits your goals</li>
                                </ul>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="https://adverlyx.digital/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
                                </div>
                                <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0; text-align: center;">If you have any questions, reply to this email or contact support@adverlyx.digital</p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; 2026 {BRAND_NAME}. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_payment_confirmation_email_html(name: str, plan: str, amount: float, billing: str) -> str:
    """Generate payment confirmation email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Payment Confirmed!</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Thank you for your payment! Your subscription has been activated.</p>
                                
                                <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                                    <h3 style="color: #374151; margin: 0 0 15px; font-size: 18px;">Order Details</h3>
                                    <table width="100%" style="color: #6b7280; font-size: 14px;">
                                        <tr>
                                            <td style="padding: 8px 0;">Plan:</td>
                                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #374151;">{plan}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0;">Billing:</td>
                                            <td style="padding: 8px 0; text-align: right; color: #374151;">{billing}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-top: 1px solid #e5e7eb;">Amount:</td>
                                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #10b981; font-size: 18px; border-top: 1px solid #e5e7eb;">${amount:.2f}</td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="https://adverlyx.digital/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a>
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">For billing inquiries, contact support@adverlyx.digital</p>
                                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">&copy; 2026 {BRAND_NAME}. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_verification_email_html(name: str, token: str) -> str:
    """Generate email verification HTML."""
    verification_url = f"https://adverlyx.digital/verify-email?token={token}"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Please verify your email address to complete your {BRAND_NAME} registration.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="{verification_url}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
                                </div>
                                <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0; text-align: center;">This link will expire in 24 hours.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; 2026 {BRAND_NAME}. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_password_reset_email_html(name: str, token: str) -> str:
    """Generate password reset email HTML."""
    reset_url = f"https://adverlyx.digital/reset-password?token={token}"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Reset Your Password</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">We received a request to reset your password. Click the button below to create a new password.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                                </div>
                                <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0; text-align: center;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; 2026 {BRAND_NAME}. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_subscription_cancelled_email_html(name: str, plan: str) -> str:
    """Generate subscription cancellation email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #6b7280 0%, #374151 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Subscription Cancelled</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Your {plan} subscription has been cancelled.</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">You'll continue to have access until the end of your current billing period.</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="https://adverlyx.digital/pricing" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Resubscribe</a>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Questions? Contact support@adverlyx.digital</p>
                                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">&copy; 2026 {BRAND_NAME}. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_refund_email_html(name: str, amount: float, reason: str = "") -> str:
    """Generate refund confirmation email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Refund Processed</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Your refund has been processed successfully.</p>
                                
                                <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
                                    <p style="color: #166534; font-size: 14px; margin: 0 0 5px;">Refund Amount</p>
                                    <p style="color: #166534; font-size: 32px; font-weight: bold; margin: 0;">${amount:.2f}</p>
                                </div>
                                
                                {f'<p style="color: #6b7280; font-size: 14px; margin: 20px 0;">Reason: {reason}</p>' if reason else ''}
                                
                                <p style="color: #374151; font-size: 16px; margin: 20px 0 0;">The refund will be credited to your original payment method within 5-10 business days.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="color: #9ca3af; font-size: 12px; margin: 0;">Questions? Contact support@adverlyx.digital</p>
                                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0;">&copy; 2026 {BRAND_NAME}. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


# ==================== HELPER FUNCTIONS ====================

async def send_welcome_email(email: str, name: str) -> Optional[str]:
    """Send welcome email to new user."""
    subject = f"Welcome to {BRAND_NAME}! 🎉"
    html = get_welcome_email_html(name)
    return await send_email(email, subject, html)


async def send_payment_confirmation_email(email: str, name: str, plan: str, amount: float, billing: str) -> Optional[str]:
    """Send payment confirmation email."""
    subject = f"Payment Confirmed - {BRAND_NAME}"
    html = get_payment_confirmation_email_html(name, plan, amount, billing)
    return await send_email(email, subject, html)


async def send_verification_email(email: str, name: str, token: str) -> Optional[str]:
    """Send email verification."""
    subject = f"Verify Your Email - {BRAND_NAME}"
    html = get_verification_email_html(name, token)
    return await send_email(email, subject, html)


async def send_password_reset_email(email: str, name: str, token: str) -> Optional[str]:
    """Send password reset email."""
    subject = f"Reset Your Password - {BRAND_NAME}"
    html = get_password_reset_email_html(name, token)
    return await send_email(email, subject, html)


async def send_subscription_cancelled_email(email: str, name: str, plan: str) -> Optional[str]:
    """Send subscription cancellation email."""
    subject = f"Subscription Cancelled - {BRAND_NAME}"
    html = get_subscription_cancelled_email_html(name, plan)
    return await send_email(email, subject, html)


async def send_refund_email(email: str, name: str, amount: float, reason: str = "") -> Optional[str]:
    """Send refund confirmation email."""
    subject = f"Refund Processed - {BRAND_NAME}"
    html = get_refund_email_html(name, amount, reason)
    return await send_email(email, subject, html)
