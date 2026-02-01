from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid
import json
import os
import logging

from models.user import (
    User, UserCreate, UserUpdate, UserLogin, UserResponse, 
    TokenResponse, UserRole, UserStatus
)
from utils.auth import (
    hash_password, verify_password, create_access_token, 
    create_refresh_token, decode_token, generate_verification_token,
    generate_reset_token, get_current_user
)
from utils.email import send_verification_email, send_password_reset_email, send_welcome_email
from utils.security import check_rate_limit, get_client_ip, validate_password, validate_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Database will be injected
db = None

def init_router(database):
    global db
    db = database


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, request: Request):
    """Register a new user."""
    # Rate limiting
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "register")
    
    # Validate password strength
    try:
        validate_password(user_data.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Check if email exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    verification_token = generate_verification_token()
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        verification_token=verification_token,
        status=UserStatus.PENDING_VERIFICATION
    )
    
    # Save to database
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # Send verification email
    await send_verification_email(user.email, user.name, verification_token)
    
    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "user_id": user.id
    }


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, request: Request):
    """Login and get access token."""
    # Rate limiting for auth attempts
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "auth")
    
    # Find user
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is suspended
    if user_doc.get('status') == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended. Please contact support."
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user_doc['id']},
        {
            "$set": {
                "last_login": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"login_count": 1}
        }
    )
    
    # Create tokens
    token_data = {
        "sub": user_doc['id'],
        "email": user_doc['email'],
        "role": user_doc.get('role', UserRole.USER)
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Build user response
    user_response = UserResponse(
        id=user_doc['id'],
        email=user_doc['email'],
        name=user_doc['name'],
        role=user_doc.get('role', UserRole.USER),
        status=user_doc.get('status', UserStatus.ACTIVE),
        avatar_url=user_doc.get('avatar_url'),
        current_plan=user_doc.get('current_plan'),
        email_verified=user_doc.get('email_verified', False),
        created_at=datetime.fromisoformat(user_doc['created_at']) if isinstance(user_doc['created_at'], str) else user_doc['created_at'],
        last_login=datetime.now(timezone.utc),
        ai_analysis=user_doc.get('ai_analysis')
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request_data: RefreshTokenRequest):
    """Refresh access token."""
    payload = decode_token(request_data.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # Get user
    user_doc = await db.users.find_one({"id": payload.get("sub")})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create new tokens
    token_data = {
        "sub": user_doc['id'],
        "email": user_doc['email'],
        "role": user_doc.get('role', UserRole.USER)
    }
    
    access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)
    
    user_response = UserResponse(
        id=user_doc['id'],
        email=user_doc['email'],
        name=user_doc['name'],
        role=user_doc.get('role', UserRole.USER),
        status=user_doc.get('status', UserStatus.ACTIVE),
        avatar_url=user_doc.get('avatar_url'),
        current_plan=user_doc.get('current_plan'),
        email_verified=user_doc.get('email_verified', False),
        created_at=datetime.fromisoformat(user_doc['created_at']) if isinstance(user_doc['created_at'], str) else user_doc['created_at'],
        last_login=datetime.fromisoformat(user_doc['last_login']) if user_doc.get('last_login') else None,
        ai_analysis=user_doc.get('ai_analysis')
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=user_response
    )


@router.post("/verify-email")
async def verify_email(request_data: VerifyEmailRequest):
    """Verify user email."""
    user_doc = await db.users.find_one({"verification_token": request_data.token})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Update user
    await db.users.update_one(
        {"id": user_doc['id']},
        {
            "$set": {
                "email_verified": True,
                "status": UserStatus.ACTIVE,
                "verification_token": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Send welcome email
    await send_welcome_email(user_doc['email'], user_doc['name'])
    
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
async def forgot_password(request_data: ForgotPasswordRequest, request: Request):
    """Request password reset."""
    # Rate limiting
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip, "password_reset")
    
    user_doc = await db.users.find_one({"email": request_data.email})
    if not user_doc:
        # Don't reveal if email exists
        return {"message": "If the email exists, a reset link will be sent."}
    
    # Generate reset token
    reset_token = generate_reset_token()
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    await db.users.update_one(
        {"id": user_doc['id']},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": expires.isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Send reset email
    await send_password_reset_email(user_doc['email'], user_doc['name'], reset_token)
    
    return {"message": "If the email exists, a reset link will be sent."}


@router.post("/reset-password")
async def reset_password(request_data: ResetPasswordRequest):
    """Reset password with token."""
    user_doc = await db.users.find_one({"reset_token": request_data.token})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token expired
    if user_doc.get('reset_token_expires'):
        expires = datetime.fromisoformat(user_doc['reset_token_expires'])
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired"
            )
    
    # Update password
    await db.users.update_one(
        {"id": user_doc['id']},
        {
            "$set": {
                "password_hash": hash_password(request_data.password),
                "reset_token": None,
                "reset_token_expires": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Password reset successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user info."""
    user_doc = await db.users.find_one({"id": current_user['user_id']})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user_doc['id'],
        email=user_doc['email'],
        name=user_doc['name'],
        role=user_doc.get('role', UserRole.USER),
        status=user_doc.get('status', UserStatus.ACTIVE),
        avatar_url=user_doc.get('avatar_url'),
        current_plan=user_doc.get('current_plan'),
        email_verified=user_doc.get('email_verified', False),
        created_at=datetime.fromisoformat(user_doc['created_at']) if isinstance(user_doc['created_at'], str) else user_doc['created_at'],
        last_login=datetime.fromisoformat(user_doc['last_login']) if user_doc.get('last_login') else None,
        ai_analysis=user_doc.get('ai_analysis')
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update current user info."""
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    # Regular users can't change their role or status
    if current_user['role'] == UserRole.USER:
        update_data.pop('role', None)
        update_data.pop('status', None)
    
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one(
            {"id": current_user['user_id']},
            {"$set": update_data}
        )
    
    # Return updated user
    user_doc = await db.users.find_one({"id": current_user['user_id']})
    return UserResponse(
        id=user_doc['id'],
        email=user_doc['email'],
        name=user_doc['name'],
        role=user_doc.get('role', UserRole.USER),
        status=user_doc.get('status', UserStatus.ACTIVE),
        avatar_url=user_doc.get('avatar_url'),
        current_plan=user_doc.get('current_plan'),
        email_verified=user_doc.get('email_verified', False),
        created_at=datetime.fromisoformat(user_doc['created_at']) if isinstance(user_doc['created_at'], str) else user_doc['created_at'],
        last_login=datetime.fromisoformat(user_doc['last_login']) if user_doc.get('last_login') else None
    )



# ============== Data Deletion ==============

class DeletionRequest(BaseModel):
    email: EmailStr


@router.post("/request-deletion")
async def request_data_deletion(request: DeletionRequest):
    """
    Request deletion of user data (GDPR/CCPA compliance).
    This endpoint creates a deletion request that will be processed.
    """
    email = request.email.lower()
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    
    # Create deletion request (even if user not found, for privacy)
    deletion_request = {
        "id": str(uuid.uuid4()),
        "email": email,
        "user_id": user.get("id") if user else None,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "processed_at": None,
        "source": "web_form"
    }
    
    await db.deletion_requests.insert_one(deletion_request)
    
    # Log the request
    logger.info(f"Data deletion request received for email: {email}")
    
    return {
        "message": "Deletion request submitted successfully",
        "confirmation_id": deletion_request["id"],
        "estimated_completion": "30 days"
    }


@router.post("/facebook/deletion-callback")
async def facebook_deletion_callback(
    signed_request: str = None
):
    """
    Facebook Data Deletion Callback.
    This endpoint is called by Facebook when a user requests data deletion.
    Returns a confirmation code and URL for status checking.
    """
    import base64
    import hmac
    import hashlib
    
    if not signed_request:
        raise HTTPException(status_code=400, detail="Missing signed_request")
    
    try:
        # Parse the signed request from Facebook
        encoded_sig, payload = signed_request.split('.', 2)
        
        # Decode payload
        payload += '=' * (4 - len(payload) % 4)  # Add padding
        data = json.loads(base64.urlsafe_b64decode(payload))
        
        user_id = data.get('user_id')
        
        if user_id:
            # Create deletion request
            confirmation_code = str(uuid.uuid4())[:8].upper()
            
            deletion_request = {
                "id": str(uuid.uuid4()),
                "facebook_user_id": user_id,
                "confirmation_code": confirmation_code,
                "status": "pending",
                "requested_at": datetime.now(timezone.utc).isoformat(),
                "source": "facebook_callback"
            }
            
            await db.deletion_requests.insert_one(deletion_request)
            
            # Return the required Facebook response format
            frontend_url = os.environ.get("FRONTEND_URL", "https://adverlyx.com")
            return {
                "url": f"{frontend_url}/data-deletion?code={confirmation_code}",
                "confirmation_code": confirmation_code
            }
    except Exception as e:
        logger.error(f"Facebook deletion callback error: {str(e)}")
    
    # Fallback response
    return {
        "url": os.environ.get("FRONTEND_URL", "https://adverlyx.com") + "/data-deletion",
        "confirmation_code": "PENDING"
    }


@router.get("/deletion-status/{confirmation_code}")
async def check_deletion_status(confirmation_code: str):
    """
    Check the status of a data deletion request.
    """
    request = await db.deletion_requests.find_one(
        {"confirmation_code": confirmation_code.upper()},
        {"_id": 0}
    )
    
    if not request:
        raise HTTPException(status_code=404, detail="Deletion request not found")
    
    return {
        "status": request.get("status", "pending"),
        "requested_at": request.get("requested_at"),
        "processed_at": request.get("processed_at"),
        "message": "Your data deletion request is being processed" if request.get("status") == "pending" else "Your data has been deleted"
    }



# ============== Google OAuth (Emergent Auth) ==============
# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

import httpx

class GoogleSessionRequest(BaseModel):
    session_id: str


@router.post("/google/session")
async def process_google_session(request: GoogleSessionRequest):
    """
    Process Google OAuth session from Emergent Auth.
    Exchange session_id for user data and create/update user.
    """
    try:
        # Call Emergent Auth API to get user data
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            
            if response.status_code != 200:
                logger.error(f"Emergent Auth error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired session"
                )
            
            google_data = response.json()
    except httpx.RequestError as e:
        logger.error(f"Failed to connect to Emergent Auth: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )
    
    email = google_data.get("email", "").lower()
    name = google_data.get("name", "")
    picture = google_data.get("picture", "")
    google_id = google_data.get("id", "")
    session_token = google_data.get("session_token", "")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google"
        )
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    now = datetime.now(timezone.utc)
    
    if existing_user:
        # Update existing user with Google data
        user_id = existing_user["id"]
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "google_id": google_id,
                "avatar_url": picture if not existing_user.get("avatar_url") else existing_user.get("avatar_url"),
                "email_verified": True,
                "last_login": now.isoformat(),
                "auth_provider": "google",
                "updated_at": now.isoformat()
            }}
        )
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        new_user = {
            "id": user_id,
            "email": email,
            "name": name,
            "google_id": google_id,
            "avatar_url": picture,
            "role": UserRole.USER,
            "status": UserStatus.ACTIVE,
            "email_verified": True,
            "auth_provider": "google",
            "current_plan": None,
            "created_at": now.isoformat(),
            "last_login": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await db.users.insert_one(new_user)
        user_doc = {k: v for k, v in new_user.items() if k != "password_hash"}
        
        # Send welcome email
        try:
            await send_welcome_email(email, name)
        except Exception as e:
            logger.warning(f"Failed to send welcome email: {e}")
    
    # Store session in database for session management
    session_data = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (now + timedelta(days=7)).isoformat(),
        "created_at": now.isoformat(),
        "auth_provider": "google"
    }
    await db.user_sessions.update_one(
        {"user_id": user_id},
        {"$set": session_data},
        upsert=True
    )
    
    # Generate our own JWT tokens for consistency with existing auth
    access_token = create_access_token({"user_id": user_id, "email": email, "role": user_doc.get("role", UserRole.USER)})
    refresh_token = create_refresh_token({"user_id": user_id})
    
    logger.info(f"Google OAuth login successful for: {email}")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "name": user_doc["name"],
            "role": user_doc.get("role", UserRole.USER),
            "avatar_url": user_doc.get("avatar_url"),
            "current_plan": user_doc.get("current_plan"),
            "email_verified": True
        }
    }


@router.post("/google/logout")
async def google_logout(current_user: dict = Depends(get_current_user)):
    """Logout user and invalidate Google session."""
    user_id = current_user["user_id"]
    
    # Remove session from database
    await db.user_sessions.delete_one({"user_id": user_id})
    
    # Update user last_logout
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"last_logout": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Logged out successfully"}
