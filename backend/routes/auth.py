from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
from typing import Optional

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
        last_login=datetime.now(timezone.utc)
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
        last_login=datetime.fromisoformat(user_doc['last_login']) if user_doc.get('last_login') else None
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
async def forgot_password(request_data: ForgotPasswordRequest):
    """Request password reset."""
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
        last_login=datetime.fromisoformat(user_doc['last_login']) if user_doc.get('last_login') else None
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
