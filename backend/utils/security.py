"""
Rate limiting middleware and utilities for Adverlyx Digital.
Protects sensitive endpoints from abuse.
"""
import time
from collections import defaultdict
from functools import wraps
from fastapi import HTTPException, Request, status
from typing import Callable, Dict, Tuple
import asyncio
import logging

logger = logging.getLogger(__name__)

# In-memory rate limit storage
# In production, use Redis for distributed rate limiting
rate_limit_storage: Dict[str, Dict[str, Tuple[int, float]]] = defaultdict(dict)

# Rate limit configurations (requests, window_seconds)
RATE_LIMITS = {
    "auth": (5, 60),           # 5 attempts per minute for auth endpoints
    "register": (3, 300),      # 3 registrations per 5 minutes
    "password_reset": (3, 300),# 3 password resets per 5 minutes
    "payment": (10, 60),       # 10 payment requests per minute
    "api": (100, 60),          # 100 general API calls per minute
    "admin": (200, 60),        # 200 admin API calls per minute
}


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(key: str, limit_type: str = "api") -> bool:
    """
    Check if request is within rate limits.
    Returns True if allowed, raises HTTPException if exceeded.
    """
    max_requests, window_seconds = RATE_LIMITS.get(limit_type, RATE_LIMITS["api"])
    current_time = time.time()
    
    if key in rate_limit_storage[limit_type]:
        count, window_start = rate_limit_storage[limit_type][key]
        
        # Check if we're in the same window
        if current_time - window_start < window_seconds:
            if count >= max_requests:
                retry_after = int(window_seconds - (current_time - window_start))
                logger.warning(f"Rate limit exceeded for {key} on {limit_type}")
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Please try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )
            # Increment counter
            rate_limit_storage[limit_type][key] = (count + 1, window_start)
        else:
            # New window, reset counter
            rate_limit_storage[limit_type][key] = (1, current_time)
    else:
        # First request
        rate_limit_storage[limit_type][key] = (1, current_time)
    
    return True


def rate_limit(limit_type: str = "api"):
    """
    Decorator for rate limiting endpoints.
    
    Usage:
        @router.post("/login")
        @rate_limit("auth")
        async def login(request: Request, ...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find request in args or kwargs
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
            
            if request:
                client_ip = get_client_ip(request)
                check_rate_limit(client_ip, limit_type)
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def cleanup_rate_limits():
    """Periodically clean up expired rate limit entries."""
    while True:
        await asyncio.sleep(300)  # Run every 5 minutes
        current_time = time.time()
        
        for limit_type, entries in rate_limit_storage.items():
            _, window_seconds = RATE_LIMITS.get(limit_type, RATE_LIMITS["api"])
            expired_keys = [
                key for key, (_, window_start) in entries.items()
                if current_time - window_start > window_seconds * 2
            ]
            for key in expired_keys:
                del entries[key]
        
        logger.debug("Rate limit storage cleaned up")


# Input validation utilities
import re
from pydantic import validator, field_validator

def validate_email(email: str) -> str:
    """Validate email format."""
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValueError("Invalid email format")
    if len(email) > 255:
        raise ValueError("Email too long")
    return email.lower().strip()


def validate_password(password: str) -> str:
    """Validate password strength."""
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    if len(password) > 128:
        raise ValueError("Password too long")
    if not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r'[a-z]', password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r'\d', password):
        raise ValueError("Password must contain at least one number")
    return password


def validate_username(username: str) -> str:
    """Validate Instagram username format."""
    username = username.strip().lower()
    if username.startswith('@'):
        username = username[1:]
    if not re.match(r'^[a-z0-9._]{1,30}$', username):
        raise ValueError("Invalid Instagram username format")
    return username


def sanitize_string(text: str, max_length: int = 1000) -> str:
    """Sanitize user input string."""
    if not text:
        return ""
    # Remove control characters
    text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', text)
    # Trim whitespace
    text = text.strip()
    # Limit length
    return text[:max_length]


def validate_url(url: str) -> str:
    """Validate URL format."""
    url_pattern = r'^https?://[^\s<>"{}|\\^`\[\]]+$'
    if not re.match(url_pattern, url):
        raise ValueError("Invalid URL format")
    if len(url) > 2048:
        raise ValueError("URL too long")
    return url
