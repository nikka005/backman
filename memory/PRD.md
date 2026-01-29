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

### UI/UX Fixes (January 29, 2026)

- [x] **Admin Sidebar Scroll Fix**
  - Fixed sidebar overflow issue where navigation was hidden
  - Proper flex layout with scrollable nav area
  - Logout button no longer overlapped by menu items

- [x] **Admin Management Pages (No More "Coming Soon")**
  - Subscriptions page - View all subscriptions, cancel subscriptions
  - Payments page - View payments with stats (total revenue, this month, pending)
  - Instagram Accounts page - View connected accounts, toggle growth pause/resume
  - Support Tickets page - View and update ticket status
  - Notifications page - Send broadcast announcements

- [x] **User Dashboard Tabs**
  - All menu items now functional (Targeting, Analytics, Support, Settings)
  - Targeting tab - Configure niche, location, competitors, hashtags
  - Analytics tab - View growth metrics and stats
  - Support tab - Create tickets, view FAQ
  - Settings tab - Account settings, notifications, danger zone

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

### Phase 6: Enterprise Feature Management System ✅ COMPLETE
**Completed: January 29, 2026**

- [x] **Feature Management Models**
  - PageConfig with SEO, navigation, access control settings
  - SectionConfig with content, style, order management
  - PlatformFeatureConfig with dependencies, usage limits
  - PaymentOptionConfig with provider credentials, webhooks
  - AuthOptionConfig with security settings
  - FeatureChangeLog for audit trail

- [x] **Feature Management API Routes**
  - `/api/admin/feature-management/initialize` - Initialize defaults
  - CRUD for Pages, Sections, Platform, Payments, Auth
  - Publish/Draft workflow for pages and sections
  - Bulk toggle enable/disable
  - Sync to site settings
  - Audit logs endpoint

- [x] **Feature Management UI**
  - New "Feature Manager" sidebar item in Admin Panel
  - 5 tabs: Pages (7), Sections (9), Platform (6), Payments (4), Authentication (3)
  - Feature list with toggle switches and Manage buttons
  - Edit views with type-specific settings:
    - Pages: Basic Settings, URL & Navigation, SEO, Access Control
    - Sections: Content, Style, Display Order
    - Platform: Access Control, UI Configuration
    - Payments: Payment Config, API Credentials, Webhook Status
    - Auth: Settings, Provider Credentials, Security Limits
  - Recent Changes audit log

- [x] **SPA Navigation Fix**
  - Replaced `<a href>` tags with React Router `<Link>` components
  - Fixed in ConnectInstagramPage.jsx and FAQSection.jsx
  - Proper active state handling for nested routes

---

### Phase 7: Admin Tools & Export System ✅ COMPLETE
**Completed: January 29, 2026**

- [x] **Email Template Customization**
  - 5 customizable templates: Welcome, Payment Confirmation, Password Reset, Subscription Update, Payment Failed
  - Visual HTML editor with live preview iframe
  - Variable support ({{name}}, {{plan}}, {{amount}}, etc.)
  - Test send functionality
  - Reset to default option
  - `/api/admin/email-templates/` - CRUD endpoints

- [x] **Push Notifications System**
  - Real-time WebSocket connection manager
  - Broadcast notifications to all users or by plan
  - Notification types: System, Payment, Subscription, Growth, Support, Promotion
  - Priority levels: Low, Normal, High
  - Admin broadcast form with preview
  - `/api/notifications/` - User notification endpoints
  - `/api/notifications/admin/broadcast` - Admin broadcast endpoint

- [x] **API Rate Limits Dashboard**
  - Overview tab with stats: Requests today, Last hour, Blocked, Block rate
  - Configuration tab to adjust limits per endpoint
  - Blocked IPs management (view, unblock, manual block)
  - 7 configurable endpoints: auth_login, auth_register, password_reset, payment, api_general, instagram_connect, ticket_create
  - `/api/admin/rate-limits/` - Config and stats endpoints

- [x] **Data Export System**
  - 8 export types: Users, Subscriptions, Payments, Analytics, Instagram Accounts, Tickets, Funnel Events, Growth Logs
  - CSV and JSON format options
  - Period selection (7, 30, 90, 365 days)
  - Full Platform Report (comprehensive JSON)
  - `/api/admin/export/` - All export endpoints

- [x] **Stripe Webhook Handlers Enhanced**
  - Email notifications on payment success (payment_confirmation template)
  - Email notifications on payment failure (payment_failed template)
  - Handles: checkout.session.completed, subscription.created/updated/deleted, invoice.paid, invoice.payment_failed, charge.refunded

---

---

### Phase 8: Multi-Currency & Razorpay Integration ✅ COMPLETE
**Completed: January 29, 2026**

- [x] **Razorpay Payment Integration**
  - Full Razorpay SDK integration (razorpay 2.0.0)
  - Order creation and payment verification
  - Webhook handlers for payment.captured, payment.failed, refund.created
  - INR pricing packages (₹4,067 - ₹98,604)
  - `/api/payments/razorpay/create-order` - Create payment order
  - `/api/payments/razorpay/verify-payment` - Verify payment signature
  - `/api/payments/razorpay/webhook` - Handle Razorpay webhooks
  - `/api/payments/razorpay/packages` - Get INR packages

- [x] **Automatic Currency Detection**
  - IP-based country detection using ip-api.com
  - 40+ country-currency mappings
  - Exchange rate conversion for all major currencies
  - Automatic payment provider selection:
    - India (INR) → Razorpay
    - Other countries → Stripe
  - `/api/public/localized-pricing` - Get localized prices

- [x] **Supported Currencies**
  - USD, EUR, GBP, CAD, AUD, JPY, INR, SGD, AED, SAR
  - MYR, THB, IDR, PHP, VND, KRW, CHF, SEK, NOK, DKK
  - PLN, RUB, MXN, BRL, ZAR, NZD, and more

- [x] **Frontend Payment Handler Component**
  - `PaymentHandler.jsx` - Unified payment component
  - Auto-detects currency and provider
  - Stripe redirect flow
  - Razorpay popup integration
  - `LocalizedPrice` component for displaying prices
  - `CurrencyBadge` component for showing current currency

---

### Phase 9: Admin Panel UI Enhancements ✅ COMPLETE
**Completed: January 29, 2026**

- [x] **Users Management Enhanced**
  - View User Details modal with full profile information
  - Shows subscription details, 2FA status, join date
  - Quick Activate/Suspend actions from modal

- [x] **Subscriptions Management Enhanced**
  - Change Plan modal with plan selection dropdown
  - Quick Cancel button for active subscriptions
  - View all subscription details in table

- [x] **Payments Management Enhanced**
  - Refund modal with amount and reason fields
  - Process partial or full refunds
  - Stats showing total revenue, monthly revenue, pending payments

- [x] **Support Tickets Enhanced**
  - Ticket Detail modal with full conversation view
  - Reply to Customer textarea with Send Reply button
  - Mark Resolved quick action
  - Status dropdown for quick status updates

---

## Future Enhancements (Backlog)
- Real Instagram API integration (Meta Graph API)
- AdminDashboard.jsx refactoring (extract inline components)
- PayPal payment integration
- Full Onboarding Wizard (Option B) - Multi-step with PDF reports

---

### Phase 10: Adverlyx Intelligence AI System ✅ COMPLETE
**Completed: January 29, 2026**

- [x] **AI Backend Infrastructure**
  - LLM integration using Emergent LLM Key with emergentintegrations library
  - Primary provider: OpenAI GPT-5.2 (complex reasoning, policy adherence)
  - Fallback provider: Anthropic Claude Sonnet 4.5 (long reports, summaries)
  - Automatic failover between providers
  - Master system prompt implementing Adverlyx Intelligence identity

- [x] **AI Models & Data Structures**
  - `AIGrowthPlan` - AI-generated growth strategies per user
  - `AIAnalyticsInsight` - AI-interpreted analytics insights
  - `AIRiskAssessment` - AI-driven risk analysis
  - `AIConversation` - Admin chat sessions with message history
  - `AISettings` - Admin-controlled AI module toggles
  - `AILog` - Audit trail for all AI activities

- [x] **AI Decision Support Chat**
  - Real-time chat interface for admin queries
  - Conversation history with message persistence
  - Context-aware responses using platform data
  - Provider and model attribution per response

- [x] **AI Growth Planning Module**
  - Generate personalized growth plans per user
  - Inputs: User profile, targeting preferences, historical growth
  - Outputs: Speed, daily targets, priorities, risk level, review cycle
  - Admin approval workflow for plans

- [x] **AI Analytics Intelligence**
  - Run AI analysis on platform metrics
  - Analysis types: General, Performance, Trends, Anomalies
  - Time period selection: 7, 30, 90 days
  - Human-readable insights with recommendations

- [x] **AI Risk Assessment**
  - Platform-wide risk analysis
  - User-specific and account-specific assessments
  - Risk levels: LOW, MODERATE, HIGH, CRITICAL
  - Mitigation recommendations

- [x] **AI Settings & Controls**
  - Toggle enable/disable per AI module
  - View primary and fallback LLM providers
  - Learning mode toggle
  - Activity logs with response times and success rates

- [x] **AI API Endpoints**
  - `POST /api/admin/ai/chat` - AI chat conversation
  - `GET /api/admin/ai/conversations` - List conversations
  - `POST /api/admin/ai/growth-plan/generate` - Generate growth plan
  - `GET /api/admin/ai/growth-plans` - List growth plans
  - `PUT /api/admin/ai/growth-plans/{id}/approve` - Approve plan
  - `POST /api/admin/ai/analytics/analyze` - Run analytics analysis
  - `GET /api/admin/ai/analytics/insights` - List insights
  - `POST /api/admin/ai/risk/assess` - Run risk assessment
  - `GET /api/admin/ai/risk/assessments` - List assessments
  - `GET/PUT /api/admin/ai/settings` - AI settings
  - `GET /api/admin/ai/logs` - Activity logs
  - `GET /api/admin/ai/stats` - Usage statistics

- [x] **Admin AI Intelligence UI**
  - New "AI Intelligence" nav item in admin sidebar
  - Stats dashboard: Growth Plans, Analytics Insights, Risk Assessments, Success Rate
  - 5 tabs: Chat, Growth, Analytics, Risk, Settings
  - Chat interface with conversation history
  - Growth plan generator with user selection
  - Analytics analyzer with type and period selectors
  - Risk assessment tool with target type selection
  - Settings panel with module toggles and provider info

---

### Phase 11: AI User Onboarding (Option A - Lite) ✅ COMPLETE
**Completed: January 29, 2026**

- [x] **AI Onboarding Backend**
  - `POST /api/ai/onboarding/recommendations` - Get personalized recommendations
  - `POST /api/ai/onboarding/apply-recommendations/{id}` - Apply recommendations to targeting
  - `GET /api/ai/onboarding/history` - View recommendation history
  - Plan-tier based recommendation depth:
    - Free/Trial: Basic recommendations (5 hashtags, no competitor analysis)
    - Starter+: Full recommendations (8 hashtags, 3 similar accounts)
    - Pro/Enterprise: Advanced + editable suggestions

- [x] **AI Onboarding User Inputs**
  - Primary Goal: Brand Awareness / Leads & Sales / Creator Growth
  - Growth Urgency: Slow & Safe / Balanced (recommended) / Faster
  - Target Country (optional)
  - Competitors (optional, max 5)

- [x] **AI Onboarding Outputs**
  - Detected niche/category
  - Recommended hashtags
  - Similar accounts to target
  - Target locations
  - Growth intensity recommendation
  - Suggested plan tier with reason
  - Growth expectation (safe, advisory wording)
  - Safety notes
  - AI analysis summary

- [x] **AI Onboarding UI Component**
  - 3-step flow: Input → Loading → Results
  - Clean panel design with clear CTAs
  - Apply / Customize / Skip options
  - Confidence level indicator
  - Plan upsell (soft, advisory)

- [x] **Integration with Instagram Connect Flow**
  - AI hint shown on Connect Instagram page
  - After connection → AI Onboarding modal appears
  - User can apply recommendations or skip
  - Recommendations stored for audit

- [x] **Safety & Compliance**
  - No guaranteed follower counts
  - No specific timelines
  - Advisory tone throughout
  - Safe phrases: "Based on similar accounts", "Results may vary"

