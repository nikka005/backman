"""
Two-Factor Authentication API routes for Adverlyx Digital.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from utils.auth import get_current_user
from utils.two_factor import TwoFactorAuth

router = APIRouter(prefix="/auth/2fa", tags=["Two-Factor Authentication"])

db = None
two_factor: TwoFactorAuth = None


def init_router(database):
    global db, two_factor
    db = database
    two_factor = TwoFactorAuth(database)


class SetupResponse(BaseModel):
    qr_code: str
    secret: str
    backup_codes: List[str]


class VerifyRequest(BaseModel):
    code: str


class DisableRequest(BaseModel):
    code: str


@router.get("/status")
async def get_2fa_status(current_user: dict = Depends(get_current_user)):
    """Get 2FA status for current user."""
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "enabled": user.get("two_factor_enabled", False),
        "enabled_at": user.get("two_factor_enabled_at"),
        "backup_codes_remaining": len(user.get("two_factor_backup_codes", []))
    }


@router.post("/setup", response_model=SetupResponse)
async def setup_2fa(current_user: dict = Depends(get_current_user)):
    """Initialize 2FA setup - returns QR code and backup codes."""
    user = await db.users.find_one({"id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    result = await two_factor.setup_2fa(current_user["user_id"], user["email"])
    return SetupResponse(**result)


@router.post("/verify")
async def verify_and_enable_2fa(request: VerifyRequest, current_user: dict = Depends(get_current_user)):
    """Verify code and enable 2FA."""
    success = await two_factor.verify_and_enable(current_user["user_id"], request.code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    return {"message": "2FA enabled successfully", "enabled": True}


@router.post("/disable")
async def disable_2fa(request: DisableRequest, current_user: dict = Depends(get_current_user)):
    """Disable 2FA (requires valid code)."""
    success = await two_factor.disable_2fa(current_user["user_id"], request.code)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid code")
    
    return {"message": "2FA disabled successfully", "enabled": False}


@router.post("/regenerate-backup-codes")
async def regenerate_backup_codes(request: VerifyRequest, current_user: dict = Depends(get_current_user)):
    """Regenerate backup codes (requires valid code)."""
    new_codes = await two_factor.regenerate_backup_codes(current_user["user_id"], request.code)
    if new_codes is None:
        raise HTTPException(status_code=400, detail="Invalid code")
    
    return {"backup_codes": new_codes}


@router.post("/validate")
async def validate_2fa_code(request: VerifyRequest, current_user: dict = Depends(get_current_user)):
    """Validate a 2FA code (for login flow)."""
    valid = await two_factor.verify_code(current_user["user_id"], request.code)
    return {"valid": valid}
