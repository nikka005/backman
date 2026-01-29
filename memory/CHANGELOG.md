# Adverlyx Digital - Changelog

## January 29, 2026 - Major Update

### New Features Added

#### Two-Factor Authentication (2FA)
- **Backend:** `/app/backend/utils/two_factor.py` - TOTP-based 2FA implementation using pyotp
- **Routes:** `/app/backend/routes/two_factor.py` - Setup, verify, disable, backup codes APIs
- **Frontend:** `/app/frontend/src/components/TwoFactorSettings.jsx` - Complete 2FA UI component
- Features:
  - QR code generation for authenticator apps
  - Manual entry key for TOTP setup
  - 10 backup codes for account recovery
  - Enable/disable 2FA with code verification
  - Regenerate backup codes

#### Stripe Webhooks
- **File:** `/app/backend/routes/webhooks.py`
- Handles events:
  - `checkout.session.completed` - Payment success
  - `customer.subscription.created/updated/deleted` - Subscription lifecycle
  - `invoice.paid/payment_failed` - Billing events
  - `customer.created` - New customer
  - `charge.refunded` - Refunds
- Auto-updates user subscriptions and sends notifications

#### Advanced Targeting (User Dashboard)
- Save targeting settings: niche, locations, competitors, hashtags
- API: `PUT /api/instagram/targeting`
- Real-time save with success/error feedback

#### Enhanced User Dashboard Tabs
- **Targeting Tab:** Full targeting configuration with save functionality
- **Support Tab:** Create tickets with subject/message, view FAQ
- **Settings Tab:** 
  - Account settings (name, email)
  - Two-Factor Authentication component
  - Notification preferences
  - Account deletion option

### Bug Fixes

#### Admin Panel
- Fixed sidebar scroll overflow - navigation no longer hidden
- Fixed logout button overlap with navigation items
- Replaced "Coming Soon" placeholders with functional pages:
  - Subscriptions management (view/cancel)
  - Payments management (stats, history)
  - Instagram accounts (view/pause/resume)
  - Support tickets (status updates)
  - Notifications (broadcast announcements)

#### User Dashboard
- All menu items now functional (Targeting, Analytics, Support, Settings)
- Fixed AJAX behavior - no full page refresh on tab switches
- Real targeting save functionality

### API Endpoints Added
- `POST /api/auth/2fa/setup` - Initialize 2FA
- `POST /api/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA
- `GET /api/auth/2fa/status` - Get 2FA status
- `POST /api/auth/2fa/regenerate-backup-codes` - New backup codes
- `POST /api/webhooks/stripe` - Stripe webhook handler
- `POST /api/admin/subscriptions/{id}/cancel` - Cancel subscription
- `PUT /api/admin/instagram-accounts/{id}` - Update IG account

### Dependencies Added
- `pyotp==2.9.0` - TOTP generation/verification
- `qrcode[pil]==8.2` - QR code generation

### Environment Variables Added
- `STRIPE_WEBHOOK_SECRET` - For webhook signature verification

---

## Previous Updates
(See PRD.md for Phase 1-5 completion details)
