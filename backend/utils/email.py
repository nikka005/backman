import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Email configuration
EMAIL_ENABLED = os.environ.get("EMAIL_ENABLED", "false").lower() == "true"
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@adverlyx.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")


async def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email. Returns True if successful."""
    if not EMAIL_ENABLED:
        logger.info(f"Email disabled. Would send to {to_email}: {subject}")
        return True
    
    try:
        # In production, use a real email service like SendGrid, SES, etc.
        # For now, just log the email
        logger.info(f"Sending email to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_verification_email(to_email: str, name: str, token: str) -> bool:
    """Send email verification link."""
    verify_url = f"{FRONTEND_URL}/verify-email?token={token}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f97316, #ec4899); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Adverlyx Digital</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
            <h2>Welcome, {name}!</h2>
            <p>Thank you for signing up for Adverlyx. Please verify your email address to get started.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #666; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, "Verify your email - Adverlyx", html_content)


async def send_password_reset_email(to_email: str, name: str, token: str) -> bool:
    """Send password reset link."""
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f97316, #ec4899); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Adverlyx Digital</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
            <h2>Password Reset Request</h2>
            <p>Hi {name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}" style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, "Reset your password - Adverlyx", html_content)


async def send_welcome_email(to_email: str, name: str) -> bool:
    """Send welcome email after verification."""
    dashboard_url = f"{FRONTEND_URL}/dashboard"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f97316, #ec4899); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Adverlyx Digital</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
            <h2>Welcome to Adverlyx, {name}! 🎉</h2>
            <p>Your email has been verified and your account is now active.</p>
            <p>Here's what you can do next:</p>
            <ul>
                <li>Connect your Instagram account</li>
                <li>Set up your targeting preferences</li>
                <li>Choose a growth plan</li>
                <li>Watch your audience grow!</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{dashboard_url}" style="background: linear-gradient(to right, #f97316, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Go to Dashboard</a>
            </div>
            <p style="color: #666; font-size: 14px;">Need help? Our support team is available 24/7.</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, "Welcome to Adverlyx! 🚀", html_content)


async def send_subscription_email(to_email: str, name: str, plan: str, amount: float) -> bool:
    """Send subscription confirmation email."""
    dashboard_url = f"{FRONTEND_URL}/dashboard"
    
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #f97316, #ec4899); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Adverlyx Digital</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
            <h2>Subscription Confirmed! ✅</h2>
            <p>Hi {name},</p>
            <p>Thank you for subscribing to the <strong>{plan}</strong> plan!</p>
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Plan:</strong> {plan}</p>
                <p style="margin: 10px 0 0;"><strong>Amount:</strong> ${amount}/month</p>
            </div>
            <p>Our AI growth engine is now working to find your perfect audience. You should start seeing results within 24 hours!</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{dashboard_url}" style="background: #1f2937; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">View Dashboard</a>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(to_email, f"Subscription Confirmed - {plan} Plan", html_content)
