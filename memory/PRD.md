# Adverlyx Digital - Product Requirements Document

## Overview
Adverlyx Digital is a full-stack SaaS platform for Instagram growth services (plixi.io clone). The platform allows users to grow their Instagram followers organically through AI-powered targeting, while providing administrators full control over the platform's branding, features, and pricing without code changes.

## Core Features

### User-Facing
- Instagram account connection and growth tracking
- Multiple subscription plans with different follower guarantees
- Real-time analytics dashboard with subscription management
- Billing & payment history
- Support ticket system

### Admin Control Panel
- Full branding customization (colors, fonts, logos)
- Dynamic plan creation and management
- Feature matrix management
- Content management (hero text, FAQs, testimonials)
- User management and subscription controls
- Advanced analytics with conversion funnels
- Promotion & campaign management

---

## Implementation Status

### Phase 1: Admin Global Control System ✅ COMPLETE
**Completed: January 29, 2026**

- [x] Settings model with branding, UI, features, hero, stats, promo_banner
- [x] Admin Settings API routes (GET/PUT for all sections)
- [x] Public Settings API endpoint for frontend
- [x] Admin Settings UI with tabs (Branding, UI, Features, Content, Promo Banner)
- [x] Color pickers and font selectors
- [x] Feature toggles for pages and platform features
- [x] Dynamic hero content management
- [x] Statistics editor
- [x] Promo banner with countdown timer support
- [x] Frontend refactored to use SiteSettingsContext
- [x] Homepage hero section uses dynamic content
- [x] Stats section uses dynamic data

### Phase 2: Plan, Limit & Feature Matrix ✅ COMPLETE
**Completed: January 29, 2026**

- [x] Enhanced DynamicPlan model with comprehensive limits
- [x] Feature Matrix model with category grouping
- [x] Admin Plans page with CRUD operations
- [x] Admin Feature Matrix page at `/admin/features`
- [x] Feature editing by category (Growth, Targeting, Support, Analytics, Advanced)
- [x] Boolean vs custom value toggle for features
- [x] Public feature matrix API endpoint
- [x] Pricing page dynamically loads plans from database
- [x] Pricing page shows feature comparison from database
- [x] FAQ page dynamically loads FAQs

### Phase 3: Advanced Analytics System ✅ COMPLETE
**Completed: January 29, 2026**

- [x] Platform Analytics API (`/api/admin/analytics/platform`)
- [x] Platform Trends API with daily breakdown
- [x] User Analytics API with LTV calculations
- [x] Growth Engine Analytics API
- [x] Funnel Analytics & Event Tracking API
- [x] Admin Analytics Dashboard at `/admin/analytics`
- [x] Revenue metrics (MRR, ARR, ARPU, ARPPU)
- [x] User metrics (total, active, new, churned)
- [x] Subscription metrics with churn rate
- [x] Visual trend charts (Revenue, User Growth)
- [x] Plan distribution visualization
- [x] Daily breakdown table
- [x] Live Preview feature in Admin Settings
- [x] Unsaved changes indicator
- [x] Discard changes functionality

### Phase 4: Promotion Planning System ✅ COMPLETE
**Completed: January 29, 2026**

- [x] ICP (Ideal Customer Profile) model with demographics, behavior, interests, pain points
- [x] ICP CRUD API endpoints
- [x] 3 Default ICPs seeded (Growing Influencer, Agency Client, Small Business Owner)
- [x] A/B Testing model with variants and metrics tracking
- [x] A/B Test CRUD + start/stop/select winner APIs
- [x] Campaign model with content, targeting, scheduling, metrics
- [x] Campaign CRUD + launch/pause/complete APIs
- [x] Content Templates model for reusable marketing content
- [x] Admin Promotions Dashboard at `/admin/promotions`
- [x] Overview tab with stats and quick actions
- [x] ICPs tab with cards showing demographics, niches, goals
- [x] A/B Tests tab with test management table
- [x] Campaigns tab with campaign cards and metrics

### Phase 5: Launch Readiness ✅ COMPLETE
**Completed: January 29, 2026**

- [x] **Email System (Resend Integration)**
  - Email utility module with Resend SDK
  - Welcome email template
  - Verification email template
  - Password reset email template
  - Payment confirmation email template
  - Subscription update email template
  - RESEND_API_KEY environment variable support

- [x] **User Dashboard Enhancement**
  - Real subscription data display (plan, status, billing cycle)
  - Billing tab with subscription management
  - Payment history table
  - Upgrade/Cancel subscription buttons
  - Connect Instagram banner
  - Real-time stats cards

- [x] **Security Hardening**
  - Rate limiting middleware (`utils/security.py`)
  - Auth endpoint rate limiting (5 attempts/minute)
  - Registration rate limiting (3 attempts/5 minutes)
  - Password reset rate limiting (3 attempts/5 minutes)
  - Payment endpoint rate limiting (10 requests/minute)
  - Input validation utilities (email, password, username, URL)

- [x] **Enhanced Analytics UI**
  - Geographic distribution (country-wise) visualization
  - Conversion funnel chart (Visitors → Signups → Trial → Paid)
  - Conversion rate metrics with progress bars
  - `/api/admin/analytics/geography` endpoint
  - `/api/admin/analytics/conversion-funnel` endpoint

- [x] **Instagram Integration**
  - Connect Instagram page (`/connect-instagram`)
  - Username-based connection flow
  - Terms of service acceptance
  - Security trust indicators
  - Instagram API routes (existing)

- [x] **Demo Data Seeding**
  - Seed script for demo data (`/app/backend/scripts/seed_demo_data.py`)
  - 8 demo users with subscriptions
  - Instagram accounts with targeting settings
  - Payment history records
  - Funnel events for analytics
  - Growth logs for tracking

---

## Technical Architecture

### Frontend
- React with React Router
- Tailwind CSS for styling
- shadcn/ui components
- Context API for state management (AuthContext, SiteSettingsContext)

### Backend
- FastAPI with async MongoDB (Motor)
- JWT authentication
- Role-based access control (USER, ADMIN, MANAGER)
- Rate limiting middleware
- Resend for transactional emails

### Database Collections
- `users` - User accounts and authentication
- `settings` - Platform configuration (singleton)
- `plans` - Subscription plans
- `feature_matrix` - Feature comparison data
- `subscriptions` - User subscriptions
- `instagram_accounts` - Connected IG accounts
- `targeting_settings` - User targeting preferences
- `tickets` - Support tickets
- `payments` - Payment records
- `funnel_events` - Analytics events
- `growth_logs` - Growth tracking logs

---

## API Endpoints Summary

### Public (No Auth)
- `GET /api/public/settings` - Platform settings
- `GET /api/public/plans` - Pricing plans
- `GET /api/public/feature-matrix` - Feature comparison
- `GET /api/public/faqs` - FAQ list
- `GET /api/public/testimonials` - Testimonials

### Authentication
- `POST /api/auth/register` - User registration (rate limited)
- `POST /api/auth/login` - User login (rate limited)
- `POST /api/auth/forgot-password` - Password reset (rate limited)
- `POST /api/auth/reset-password` - Set new password

### Payments
- `POST /api/payments/checkout/session` - Create Stripe checkout
- `GET /api/payments/session-status` - Check payment status
- `GET /api/payments/subscription` - Get user subscription
- `GET /api/payments/history` - Payment history
- `POST /api/payments/cancel` - Cancel subscription

### Instagram
- `POST /api/instagram/connect` - Connect account
- `GET /api/instagram/account` - Get account info
- `PUT /api/instagram/account` - Update account settings
- `GET /api/instagram/stats` - Get growth stats

### Admin Settings
- `GET/PUT /api/admin/settings/` - All settings
- `GET/PUT /api/admin/settings/branding` - Branding only
- `GET/PUT /api/admin/settings/ui` - UI settings
- `GET/PUT /api/admin/settings/features` - Feature toggles
- `GET/PUT /api/admin/settings/hero` - Hero content
- `GET/PUT /api/admin/settings/stats` - Statistics

### Admin Plans
- `GET/POST/PUT/DELETE /api/admin/plans/` - Plan CRUD
- `GET/PUT /api/admin/plans/feature-matrix` - Feature matrix

### Admin Analytics
- `GET /api/admin/analytics/platform` - Platform metrics
- `GET /api/admin/analytics/platform/trends` - Daily trends
- `GET /api/admin/analytics/users` - All users analytics
- `GET /api/admin/analytics/users/{id}` - Single user analytics
- `GET /api/admin/analytics/growth-engine` - Growth performance
- `GET /api/admin/analytics/funnel` - Funnel analytics
- `GET /api/admin/analytics/geography` - Geographic distribution
- `GET /api/admin/analytics/conversion-funnel` - Conversion metrics
- `POST /api/admin/analytics/events` - Track events

### Admin Promotions
- `GET/POST/PUT/DELETE /api/admin/promotions/icps` - ICP management
- `GET/POST/PUT/DELETE /api/admin/promotions/ab-tests` - A/B test management
- `GET/POST/PUT/DELETE /api/admin/promotions/campaigns` - Campaign management

---

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `STRIPE_API_KEY` - Stripe secret key
- `RESEND_API_KEY` - Resend API key for emails
- `SENDER_EMAIL` - Email sender address
- `CORS_ORIGINS` - Allowed CORS origins

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - Backend API URL

---

## Credentials
- Admin: `admin@adverlyx.com` / `Admin123!`
- Test User: Create via signup page

---

## Future Enhancements (Backlog)
- Real Instagram API integration (Meta Graph API)
- Webhook handlers for Stripe events
- Email template customization in admin panel
- Push notifications system
- Two-factor authentication
- API rate limit dashboard in admin
- Export analytics data to CSV/PDF
