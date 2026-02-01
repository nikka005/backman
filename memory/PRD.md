# Adverlyx Digital - Product Requirements Document

## Original Problem Statement
Build and maintain a full-stack SaaS platform for Instagram growth services. The platform includes user authentication, subscription management, payment processing, Instagram integration, admin dashboard, and partner programs.

---

## Completed Features

### Core Platform (Previously Completed)
- ✅ User authentication (email/password, Google OAuth)
- ✅ Subscription management (multiple plans)
- ✅ Payment processing (Stripe & Razorpay)
- ✅ Instagram API integration
- ✅ Admin dashboard
- ✅ Partner programs (Affiliate & Referral)
- ✅ AI Analytics dashboard
- ✅ Notification preferences
- ✅ Forgot password / Reset password flow

### New Features (Completed Feb 1, 2025)

#### 1. Automated Subscription Renewals
- **Backend:** `/app/backend/routes/subscription_renewals.py`
- **Features:**
  - Process due renewals automatically
  - Retry logic for failed payments (configurable max retries)
  - Grace period settings
  - Renewal history tracking
  - Upcoming renewals view (7, 14, 30 days)
  - Email notifications for renewals and failures
- **Admin UI:** `/admin/renewals`
  - Due Now tab, Upcoming tab, History tab
  - Process All Due button
  - Settings modal (auto-renewal, retry attempts, grace period)

#### 2. Refund Management System
- **Backend:** `/app/backend/routes/refund_management.py`
- **Features:**
  - Create refund requests (full or partial)
  - Admin approval workflow
  - Process approved refunds
  - Automatic subscription cancellation on full refund
  - Email notifications
  - Refund statistics and rate tracking
- **Admin UI:** `/admin/refunds`
  - Stats cards (Pending, Processed, Total Refunded, Refund Rate)
  - Search and filter by status
  - Refund detail modal with approve/reject actions

#### 3. Multi-language Support (i18n)
- **Backend:** `/app/backend/routes/i18n.py`
- **Supported Languages:** English, Spanish, French, German, Portuguese, Italian, Dutch, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish (14 total)
- **Features:**
  - Default translations for all major UI strings
  - Custom translation editor
  - Language auto-detection
  - User language preference
  - RTL support for Arabic
- **Admin UI:** `/admin/languages`
  - Enable/disable languages
  - Translation editor with search
  - Default language setting

#### 4. Affiliate Dashboard
- **Backend:** Uses existing `/api/programs/` endpoints
- **Frontend:** `/app/frontend/src/pages/AffiliateDashboard.jsx`
- **Features:**
  - Overview tab with stats
  - Referral program details (share link, earn $10)
  - Affiliate program details (20% commission)
  - Copy/share referral link
  - Track referrals, conversions, earnings

#### 5. PDF Invoice Generation
- **Backend:** `/app/backend/routes/invoices.py`
- **Features:**
  - Generate professional HTML invoices
  - PDF generation (with WeasyPrint)
  - Invoice for payments
  - Invoice for subscriptions
  - Admin view all invoices
  - User view own invoices
- **API Endpoints:**
  - `GET /api/invoices/payment/{payment_id}`
  - `GET /api/invoices/my-invoices`
  - `GET /api/invoices/admin/all`

#### 6. Admin Dashboard Charts & Traffic
- **Backend:** `/app/backend/routes/admin_charts.py`
- **Frontend:** `/app/frontend/src/pages/admin/AdminChartsPage.jsx`
- **Features:**
  - Real-time stats (current visitors, active users)
  - Revenue trend chart
  - User growth chart
  - Website traffic chart
  - Traffic sources distribution
  - Top pages table
  - Conversion funnel visualization
  - Geographic distribution
- **Note:** Traffic data is SIMULATED for demo. Real integration requires Google Analytics.

---

## Code Architecture

```
/app
├── backend
│   ├── routes/
│   │   ├── subscription_renewals.py (NEW)
│   │   ├── refund_management.py (NEW)
│   │   ├── invoices.py (NEW)
│   │   ├── i18n.py (NEW)
│   │   ├── admin_charts.py (NEW)
│   │   ├── auth.py
│   │   ├── payments.py
│   │   ├── razorpay_payments.py
│   │   ├── admin.py
│   │   ├── admin_analytics.py
│   │   └── ... (other routes)
│   ├── server.py
│   └── tests/
│       └── test_admin_new_features.py (NEW)
└── frontend
    └── src/
        ├── pages/
        │   ├── admin/
        │   │   ├── AdminRefundsManagement.jsx (NEW)
        │   │   ├── AdminRenewalsManagement.jsx (NEW)
        │   │   ├── AdminLanguages.jsx (NEW)
        │   │   ├── AdminChartsPage.jsx (NEW)
        │   │   └── ... (other admin pages)
        │   ├── AffiliateDashboard.jsx (NEW)
        │   └── ... (other pages)
        └── services/
            └── api.js (UPDATED with new endpoints)
```

---

## Key API Endpoints (New)

### Subscription Renewals
- `GET /api/subscription-renewals/settings`
- `PUT /api/subscription-renewals/settings`
- `GET /api/subscription-renewals/due`
- `GET /api/subscription-renewals/upcoming-renewals?days=7`
- `POST /api/subscription-renewals/process/{subscription_id}`
- `POST /api/subscription-renewals/process-all`
- `GET /api/subscription-renewals/history`

### Refund Management
- `POST /api/refunds/request`
- `GET /api/refunds/`
- `GET /api/refunds/{refund_id}`
- `POST /api/refunds/{refund_id}/approve`
- `POST /api/refunds/{refund_id}/process`
- `GET /api/refunds/stats/summary`

### Invoices
- `GET /api/invoices/payment/{payment_id}?format=html|pdf`
- `GET /api/invoices/subscription/{subscription_id}`
- `GET /api/invoices/my-invoices`
- `GET /api/invoices/admin/all`

### i18n
- `GET /api/i18n/languages`
- `GET /api/i18n/translations/{lang}`
- `GET /api/i18n/settings`
- `PUT /api/i18n/settings`
- `PUT /api/i18n/translations/{lang}`
- `GET /api/i18n/user-preference`
- `PUT /api/i18n/user-preference?lang={lang}`

### Admin Charts
- `GET /api/admin/charts/revenue?days=30`
- `GET /api/admin/charts/users?days=30`
- `GET /api/admin/charts/traffic?days=30`
- `GET /api/admin/charts/traffic-sources`
- `GET /api/admin/charts/top-pages`
- `GET /api/admin/charts/conversion-funnel`
- `GET /api/admin/charts/geographic`
- `GET /api/admin/charts/realtime`
- `GET /api/admin/charts/dashboard-summary`

---

## Database Collections (New)

- `renewal_payments` - Tracks renewal payment attempts
- `refunds` - Refund requests and processing
- `invoices` - Generated invoice records
- `translations` - Custom translation overrides

---

## Test Credentials

- **Admin:** `admin@adverlyx.com` / `Admin123!`
- **User:** `demo@user.com` / `User123!`
- **Stripe Test Card:** `4242 4242 4242 4242` | `12/28` | `123`

---

## Pending / Backlog

### P0 - Critical
- [ ] Google Sign-In on live server (needs user verification)

### P1 - High Priority
- [ ] PayPal integration
- [ ] Instagram OAuth live testing
- [ ] Email deliverability (SPF/DKIM/DMARC)
- [ ] Mobile responsive improvements
- [ ] Google Analytics integration for real traffic data

### P2 - Medium Priority
- [x] ~~Real Instagram Growth Engine API~~ - Admin manageable
- [x] ~~Google Analytics Integration~~ - GA4 Data API
- [ ] Automated subscription renewal scheduler (cron job)
- [ ] Export functionality for analytics
- [ ] Advanced reporting and insights

### P3 - Future
- [ ] Native mobile app
- [ ] TikTok/YouTube/Twitter expansion
- [ ] White-label solution
- [ ] API for third-party integrations

---

## Notes

1. **Traffic Data:** Admin charts currently use simulated traffic data. To get real data, integrate with Google Analytics API.

2. **PDF Generation:** WeasyPrint is used for PDF generation. It's optional - if not available, HTML invoices are returned instead.

3. **i18n:** Frontend translation integration pending. Backend provides all translation strings via API.

---

*Last Updated: February 1, 2025*
