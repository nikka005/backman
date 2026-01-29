# Adverlyx Digital - API Contracts & Integration Guide

## Overview
This document captures the API contracts between the frontend and backend for the Adverlyx Digital Instagram Growth Platform.

---

## 1. Authentication API (`/api/auth`)

### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "Password123!"
}
```
**Response:**
```json
{
  "message": "Registration successful...",
  "user_id": "uuid"
}
```

### POST /api/auth/login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```
**Response:**
```json
{
  "access_token": "jwt_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user|admin|support|manager",
    "status": "active|paused|suspended|pending_verification",
    "current_plan": "basic|pro|enterprise|null",
    "email_verified": true
  }
}
```

### GET /api/auth/me
**Headers:** `Authorization: Bearer {access_token}`
**Response:** User object

### PUT /api/auth/me
**Headers:** `Authorization: Bearer {access_token}`
**Request:**
```json
{
  "name": "New Name",
  "phone": "+1234567890"
}
```

---

## 2. Subscription API (`/api/subscriptions`)

### GET /api/subscriptions/plans
**Response:**
```json
[
  {
    "id": "basic",
    "name": "Basic",
    "monthly_price": 49.0,
    "yearly_price": 29.0,
    "followers_min": 1000,
    "followers_max": 1500,
    "features": ["Feature 1", "Feature 2"]
  }
]
```

### POST /api/subscriptions/subscribe
**Headers:** `Authorization: Bearer {access_token}`
**Request:**
```json
{
  "plan": "basic|pro|enterprise",
  "billing_cycle": "monthly|yearly",
  "coupon_code": "WELCOME50"
}
```

### GET /api/subscriptions/current
**Headers:** `Authorization: Bearer {access_token}`
**Response:** Current subscription or null

### POST /api/subscriptions/cancel
**Headers:** `Authorization: Bearer {access_token}`

---

## 3. Instagram API (`/api/instagram`)

### POST /api/instagram/connect
**Headers:** `Authorization: Bearer {access_token}`
**Request:**
```json
{
  "username": "instagram_username",
  "risk_disclaimer_accepted": true
}
```

### GET /api/instagram/account
**Headers:** `Authorization: Bearer {access_token}`
**Response:** Instagram account object or null

### PUT /api/instagram/account
**Headers:** `Authorization: Bearer {access_token}`
**Request:**
```json
{
  "growth_intensity": "low|medium|high",
  "growth_paused": true
}
```

### GET /api/instagram/stats
**Headers:** `Authorization: Bearer {access_token}`
**Response:**
```json
{
  "followers_count": 12847,
  "engagement_rate": 4.8,
  "total_followers_gained": 2847,
  "followers_this_month": 892
}
```

### GET /api/instagram/targeting
### PUT /api/instagram/targeting
**Request:**
```json
{
  "niche": "Fashion",
  "locations": ["USA", "UK"],
  "hashtags": ["#fashion", "#style"],
  "competitor_accounts": ["@competitor1"]
}
```

---

## 4. Support Tickets API (`/api/tickets`)

### POST /api/tickets/
**Request:**
```json
{
  "subject": "Help needed",
  "message": "Description...",
  "category": "billing|technical|account|growth|other",
  "priority": "low|medium|high|urgent"
}
```

### GET /api/tickets/
### GET /api/tickets/{ticket_id}
### POST /api/tickets/{ticket_id}/reply
### POST /api/tickets/{ticket_id}/close

---

## 5. Notifications API (`/api/notifications`)

### GET /api/notifications/
### GET /api/notifications/unread-count
### POST /api/notifications/{id}/read
### POST /api/notifications/read-all

---

## 6. Public API (`/api/public`) - No Auth Required

### GET /api/public/plans
### GET /api/public/stats
### GET /api/public/testimonials
### GET /api/public/faqs
### GET /api/public/reviews

---

## 7. Admin API (`/api/admin`) - Admin/Manager Role Required

### GET /api/admin/dashboard
**Response:**
```json
{
  "total_users": 100,
  "active_users": 80,
  "total_subscriptions": 50,
  "active_subscriptions": 45,
  "mrr": 2500.00,
  "arr": 30000.00,
  "total_revenue": 50000.00,
  "churn_rate": 2.5,
  "new_users_this_month": 15,
  "open_tickets": 5
}
```

### User Management
- GET /api/admin/users
- GET /api/admin/users/{user_id}
- PUT /api/admin/users/{user_id}
- POST /api/admin/users/{user_id}/suspend
- POST /api/admin/users/{user_id}/activate

### Subscription Management
- GET /api/admin/subscriptions
- POST /api/admin/subscriptions/{user_id}/change-plan?new_plan=pro

### Payment Management
- GET /api/admin/payments
- POST /api/admin/payments/{payment_id}/refund?amount=49&reason=Requested

### Instagram Management
- GET /api/admin/instagram-accounts
- POST /api/admin/instagram-accounts/{account_id}/update-growth

### Ticket Management
- GET /api/admin/tickets
- PUT /api/admin/tickets/{ticket_id}

### Notifications
- POST /api/admin/notifications/broadcast

### CMS
- GET /api/admin/cms/{key}
- PUT /api/admin/cms/{key}

### Logs
- GET /api/admin/logs

---

## Database Collections

1. **users** - User accounts with roles and status
2. **subscriptions** - Subscription records with billing
3. **payments** - Payment transactions
4. **instagram_accounts** - Connected Instagram accounts
5. **targeting_settings** - Growth targeting preferences
6. **growth_logs** - Activity and growth logs
7. **tickets** - Support tickets with messages
8. **notifications** - User notifications
9. **admin_logs** - Admin activity audit trail
10. **cms_content** - CMS content storage

---

## Frontend Integration Notes

### Auth Flow
1. User registers → Email verification required
2. User logs in → Receives JWT tokens
3. Access token used in `Authorization: Bearer {token}` header
4. Refresh token used when access token expires

### Protected Routes
- `/dashboard` - Requires authentication
- `/admin/*` - Requires admin/manager role

### API Service Location
- `/app/frontend/src/services/api.js` - Axios instance with interceptors
- `/app/frontend/src/context/AuthContext.jsx` - Auth state management

---

## Default Credentials

### Admin Account
- Email: admin@adverlyx.com
- Password: Admin123!

### Test User (if created via API testing)
- Email: test@example.com
- Password: Test123!
