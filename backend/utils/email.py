import os
import asyncio
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Email configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
BRAND_NAME = "Adverlyx Digital"

# Initialize Resend if API key is available
resend_client = None
if RESEND_API_KEY:
    try:
        import resend
        resend.api_key = RESEND_API_KEY
        resend_client = resend
        logger.info("Resend email service initialized")
    except ImportError:
        logger.warning("Resend package not installed")


async def send_email(to_email: str, subject: str, html_content: str) -> Optional[str]:
    """Send an email using Resend. Returns email ID on success, None on failure."""
    if not resend_client:
        logger.warning("Email service not configured, skipping email send")
        return None
    
    params = {
        "from": f"{BRAND_NAME} <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend_client.Emails.send, params)
        logger.info(f"Email sent to {to_email}: {email.get('id')}")
        return email.get("id")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return None


# Email Templates

def get_welcome_email_html(name: str) -> str:
    """Generate welcome email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                        <tr>
                            <td style="background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to {BRAND_NAME}!</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Welcome to {BRAND_NAME}! We're excited to help you grow your Instagram presence.</p>
                                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">Get started by choosing a plan and connecting your Instagram account.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {BRAND_NAME}. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


def get_payment_confirmation_html(name: str, plan: str, amount: float, billing: str) -> str:
    """Generate payment confirmation email HTML."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                        <tr>
                            <td style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Payment Confirmed!</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Your payment has been processed successfully.</p>
                                <table width="100%" style="background-color: #f9fafb; border-radius: 12px; margin-bottom: 30px;">
                                    <tr><td style="padding: 24px;">
                                        <p style="margin: 8px 0;"><strong>Plan:</strong> {plan}</p>
                                        <p style="margin: 8px 0;"><strong>Billing:</strong> {billing}</p>
                                        <p style="margin: 8px 0; font-size: 20px; color: #22c55e;"><strong>Amount:</strong> ${amount:.2f}</p>
                                    </td></tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {BRAND_NAME}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_welcome_email(email: str, name: str) -> Optional[str]:
    """Send welcome email to new user."""
    subject = f"Welcome to {BRAND_NAME}!"
    html = get_welcome_email_html(name)
    return await send_email(email, subject, html)


async def send_payment_confirmation_email(email: str, name: str, plan: str, amount: float, billing: str) -> Optional[str]:
    """Send payment confirmation email."""
    subject = f"Payment Confirmed - {BRAND_NAME}"
    html = get_payment_confirmation_html(name, plan, amount, billing)
    return await send_email(email, subject, html)


def get_verification_email_html(name: str, token: str) -> str:
    """Generate email verification HTML."""
    verification_url = f"https://adverlyx.com/verify?token={token}"
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                        <tr>
                            <td style="background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verify Your Email</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">Please verify your email address to complete your {BRAND_NAME} registration.</p>
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <a href="{verification_url}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Verify Email</a>
                                </div>
                                <p style="color: #6b7280; font-size: 14px;">Or copy this link: <br/><span style="color: #3b82f6;">{verification_url}</span></p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {BRAND_NAME}</p>
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
    reset_url = f"https://adverlyx.com/reset-password?token={token}"
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                        <tr>
                            <td style="background: linear-gradient(135deg, #f97316, #ec4899, #8b5cf6); padding: 40px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Reset Your Password</h1>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">We received a request to reset your password. Click the button below to create a new password.</p>
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600;">Reset Password</a>
                                </div>
                                <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {BRAND_NAME}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_verification_email(email: str, name: str, token: str) -> Optional[str]:
    """Send email verification email."""
    subject = f"Verify Your Email - {BRAND_NAME}"
    html = get_verification_email_html(name, token)
    return await send_email(email, subject, html)


async def send_password_reset_email(email: str, name: str, token: str) -> Optional[str]:
    """Send password reset email."""
    subject = f"Reset Your Password - {BRAND_NAME}"
    html = get_password_reset_email_html(name, token)
    return await send_email(email, subject, html)



def get_subscription_email_html(name: str, plan: str, billing: str, action: str = "subscribed") -> str:
    """Generate subscription email HTML for subscribe/upgrade/cancel."""
    action_text = {
        "subscribed": f"You've successfully subscribed to our {plan} plan!",
        "upgraded": f"Your plan has been upgraded to {plan}!",
        "cancelled": "Your subscription has been cancelled.",
    }.get(action, f"Your subscription has been updated to {plan}.")
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
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
                                <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hi {name},</p>
                                <p style="color: #374151; font-size: 16px; margin: 0 0 30px;">{action_text}</p>
                                <table width="100%" style="background-color: #f9fafb; border-radius: 12px;">
                                    <tr><td style="padding: 24px;">
                                        <p style="margin: 8px 0;"><strong>Plan:</strong> {plan}</p>
                                        <p style="margin: 8px 0;"><strong>Billing:</strong> {billing}</p>
                                    </td></tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px; text-align: center;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">© 2026 {BRAND_NAME}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


async def send_subscription_email(email: str, name: str, plan: str, billing: str, action: str = "subscribed") -> Optional[str]:
    """Send subscription update email."""
    subject = f"Subscription Update - {BRAND_NAME}"
    html = get_subscription_email_html(name, plan, billing, action)
    return await send_email(email, subject, html)