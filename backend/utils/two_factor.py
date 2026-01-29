"""
Two-Factor Authentication module for Adverlyx Digital.
Implements TOTP-based 2FA using pyotp.
"""
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timezone
from typing import Optional

def generate_totp_secret() -> str:
    """Generate a new TOTP secret key."""
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "Adverlyx") -> str:
    """Generate the TOTP provisioning URI for QR code."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def generate_qr_code(uri: str) -> str:
    """Generate QR code as base64 image."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    
    return base64.b64encode(buffer.getvalue()).decode()


def verify_totp(secret: str, code: str) -> bool:
    """Verify a TOTP code."""
    if not secret or not code:
        return False
    
    totp = pyotp.TOTP(secret)
    # Allow for 1 time step before/after current time
    return totp.verify(code, valid_window=1)


def generate_backup_codes(count: int = 10) -> list:
    """Generate backup codes for 2FA recovery."""
    import secrets
    return [secrets.token_hex(4).upper() for _ in range(count)]


class TwoFactorAuth:
    """Two-Factor Authentication handler."""
    
    def __init__(self, db):
        self.db = db
    
    async def setup_2fa(self, user_id: str, email: str) -> dict:
        """Initialize 2FA setup for a user."""
        secret = generate_totp_secret()
        uri = get_totp_uri(secret, email)
        qr_code = generate_qr_code(uri)
        backup_codes = generate_backup_codes()
        
        # Store pending 2FA setup (not activated yet)
        await self.db.two_factor_pending.update_one(
            {"user_id": user_id},
            {"$set": {
                "user_id": user_id,
                "secret": secret,
                "backup_codes": backup_codes,
                "created_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        return {
            "qr_code": f"data:image/png;base64,{qr_code}",
            "secret": secret,
            "backup_codes": backup_codes
        }
    
    async def verify_and_enable(self, user_id: str, code: str) -> bool:
        """Verify code and enable 2FA for user."""
        pending = await self.db.two_factor_pending.find_one({"user_id": user_id})
        if not pending:
            return False
        
        if not verify_totp(pending["secret"], code):
            return False
        
        # Enable 2FA for user
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {
                "two_factor_enabled": True,
                "two_factor_secret": pending["secret"],
                "two_factor_backup_codes": pending["backup_codes"],
                "two_factor_enabled_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Remove pending setup
        await self.db.two_factor_pending.delete_one({"user_id": user_id})
        
        return True
    
    async def verify_code(self, user_id: str, code: str) -> bool:
        """Verify 2FA code for login."""
        user = await self.db.users.find_one({"id": user_id})
        if not user or not user.get("two_factor_enabled"):
            return True  # 2FA not enabled, skip
        
        secret = user.get("two_factor_secret")
        if not secret:
            return True
        
        # Check TOTP code
        if verify_totp(secret, code):
            return True
        
        # Check backup codes
        backup_codes = user.get("two_factor_backup_codes", [])
        if code.upper() in [c.upper() for c in backup_codes]:
            # Remove used backup code
            backup_codes = [c for c in backup_codes if c.upper() != code.upper()]
            await self.db.users.update_one(
                {"id": user_id},
                {"$set": {"two_factor_backup_codes": backup_codes}}
            )
            return True
        
        return False
    
    async def disable_2fa(self, user_id: str, code: str) -> bool:
        """Disable 2FA for user (requires valid code)."""
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            return False
        
        # Verify code before disabling
        if not await self.verify_code(user_id, code):
            return False
        
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {
                "two_factor_enabled": False,
                "two_factor_secret": None,
                "two_factor_backup_codes": []
            }}
        )
        
        return True
    
    async def regenerate_backup_codes(self, user_id: str, code: str) -> Optional[list]:
        """Regenerate backup codes (requires valid code)."""
        if not await self.verify_code(user_id, code):
            return None
        
        new_codes = generate_backup_codes()
        await self.db.users.update_one(
            {"id": user_id},
            {"$set": {"two_factor_backup_codes": new_codes}}
        )
        
        return new_codes
