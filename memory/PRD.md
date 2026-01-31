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
- AI-powered onboarding recommendations

### Admin Control Panel
- Full branding customization (colors, fonts, logos)
- Dynamic plan creation and management
- Feature matrix management
- Content management (hero text, FAQs, testimonials)
- User management and subscription controls
- Advanced analytics with conversion funnels
- Promotion & campaign management
- AI Intelligence system for admin decision support
- Coupon management system

---

## Implementation Status (Last Updated: January 31, 2026)

### ✅ COMPLETED PHASES

#### Phase 1-4: Core Platform ✅
- Admin global control system with branding customization
- Plan, limit & feature matrix management
- Advanced analytics with revenue/user metrics
- Promotion planning system with ICPs, A/B tests, campaigns

#### Phase 5: Launch Readiness ✅
- Email system with Resend integration
- User dashboard enhancements
- Security hardening with rate limiting
- Demo data seeding

#### Phase 6-7: Enterprise Features ✅
- Feature management system with publish/draft workflow
- Email template customization
- Push notifications with WebSocket
- API rate limits dashboard
- Data export system

#### Admin Email Server UI ✅ (Jan 31, 2026)
- New `/admin/email-settings` page for SMTP configuration
- Manage email server from Admin Panel instead of .env files
- SMTP Host, Port, Username, Password fields
- SSL/TLS toggle for secure connections
- Sender email and name customization
- Test email functionality to verify settings
- Password masking for security
- Email utility now reads from database with .env fallback

#### Phase 8-9: Multi-Currency & Admin Enhancements ✅
- Razorpay integration for Indian users
- Automatic currency detection (40+ currencies)
- Admin panel UI enhancements (modals, refunds, etc.)

#### Phase 10-11: AI Systems ✅
- Adverlyx Intelligence AI (GPT-5.2 + Claude Sonnet 4.5)
- AI User Onboarding with personalized recommendations
- AI-powered growth planning, analytics, and risk assessment

#### Phase 12: Partner Programs ✅
- Affiliate program admin management
- Referral program with rewards
- Social media links management

#### Mobile UI Bug Fixes ✅ (Jan 30, 2026)
- Mobile bottom navigation routing fixed
- Dashboard tab URL synchronization
- Targeting save functionality

#### Admin Dashboard Refactoring ✅ (Jan 31, 2026)
- AdminDashboard.jsx reduced from 1346 to ~300 lines
- Extracted UsersManagement to AdminUsersManagement.jsx
- Extracted SubscriptionsManagement to AdminSubscriptionsManagement.jsx
- Extracted PaymentsManagement to AdminPaymentsManagement.jsx
- Extracted TicketsManagement to AdminTicketsManagement.jsx
- Improved code maintainability and readability

#### AI Weekly Growth Reports ✅ (Jan 31, 2026)
- New `/admin/weekly-reports` page for sending AI-powered reports
- Backend API at `/api/weekly-reports/*` for send, history, preview
- Beautiful HTML email template with growth metrics
- AI-generated insights and recommendations
- Preview functionality before sending
- Bulk send to all eligible users

#### Enhanced User Management & Growth Tracking ✅ (Jan 31, 2026)
- **Admin User Details Modal**: View/edit all user info including Instagram stats
- **Growth Progress Column**: Shows follower progress towards plan target
- **Quick Plan Change**: Buttons to switch user plans directly from modal
- **Edit Mode**: Admin can modify name, email, plan, Instagram username
- **Growth Tracking API**: New `/api/growth/*` endpoints for status, simulate, sync
- **User Dashboard Growth Card**: Shows plan progress with milestones when subscription active
- **Auto-tracking**: Subscription saves start_followers to track growth from beginning

#### Professional Checkout & Coupons ✅ (Jan 30, 2026)
- New `/checkout` page with plan summary, coupon validation
- Admin coupon management at `/admin/coupons`
- Payment method selection (Stripe/Razorpay)

#### AI Dashboard Integration ✅ (Jan 30, 2026)
- Mock Instagram stats generation for AI analysis
- AI analysis saved to user profile
- Dashboard AI Insights card

#### Instagram OAuth Flow ✅ (Jan 30, 2026)
- Backend OAuth endpoints implemented
- Token management (long-lived tokens)
- Frontend OAuth UI with manual fallback
- **BLOCKED:** Awaiting user AWS deployment with credentials

#### Legal & Compliance Pages ✅ (Jan 30, 2026)
- Privacy Policy, Terms of Service
- Refund Policy, Cookie Policy
- Data Deletion page with backend endpoint

---

## Current Status

### Completed (Jan 31, 2026)
- Admin Email Server UI: Full SMTP configuration from admin panel
- AdminDashboard.jsx refactoring: 1346 → 300 lines
- AI Weekly Growth Reports: Full implementation with preview & bulk send
- Enhanced User Management: Edit users, change plans, view Instagram stats
- Growth Tracking System: Progress tracking with milestones after purchase
- **Forgot Password Feature**: Complete flow with ForgotPasswordPage and ResetPasswordPage
- **Yearly Billing Display Fix**: Pricing page shows correct yearly totals ($492/year for Pro)
- **Payment Routes**: Backend validates and creates checkout sessions correctly
- **Automated Weekly Reports (Cron Job)**: scheduler.py with configurable weekly report sending
- **User Notification Preferences**: Full UI and API for managing email/alert preferences
- **Advanced AI Analytics**: Performance scores, AI insights, content recommendations on dashboard
- **Instagram Data Display**: Detailed metrics (reach, impressions, profile views, website clicks, recent posts)

### Upcoming Tasks (P0-P1)
1. Razorpay Configuration: Requires API keys from user for Indian payments
2. PayPal payment integration (when user is ready)
3. End-to-end Instagram OAuth testing on live server

### Future/Backlog (P2-P3)
- More email template customizations
- Advanced growth prediction models
- A/B testing for content recommendations

---

## Technical Architecture

### Frontend
- React with React Router
- Tailwind CSS + shadcn/ui components
- Context API (AuthContext, SiteSettingsContext)

### Backend
- FastAPI with async MongoDB (Motor)
- JWT authentication with role-based access
- Rate limiting middleware
- LLM integration via Emergent LLM Key

### Key Integrations
- **Stripe:** Payment processing (USD, EUR, etc.)
- **Razorpay:** Payment processing (INR)
- **OpenAI GPT-5.2:** AI analysis (via Emergent)
- **Claude Sonnet 4.5:** AI fallback (via Emergent)
- **Instagram Graph API:** OAuth flow (code ready, pending deployment)

---

### Yearly Billing Display Fix ✅ (Jan 30, 2026)
- Pricing page now shows yearly total: `$492/year` with crossed out original
- Format: `$41/mo` → `$492/year` (~~$828/year~~)
- Applied to all plans (Basic, Pro, Enterprise)

### Instagram Real Data Integration ✅ (Jan 30, 2026)
- Added `/api/instagram-api/refresh-data` endpoint for OAuth data refresh
- Added `/api/instagram-api/account-stats` endpoint for current stats
- Dashboard "Refresh Data" button for manual data sync
- OAuth connections fetch real Instagram followers, posts, engagement
- Manual connections show prompt to connect via OAuth

### Admin Documentation Page ✅ (Jan 30, 2026)
- New `/admin/docs` route with comprehensive admin guide
- Covers 20+ features: AI Intelligence, Analytics, Plans, Coupons, etc.
- Searchable and expandable sections
- Added to admin sidebar navigation

### Manual Connection Flow Improvements ✅ (Jan 30, 2026)
- Smarter stats generation based on username characteristics
- Auto-generated profile pictures using UI Avatars
- Display name auto-generated from username
- New `/api/instagram/sync` endpoint for growth simulation
- Growth rate: ~60 followers/day baseline with targeting multipliers
- Dashboard "Refresh Data" now works with manual connections

### Meta App Review Guide
For real Instagram API access:
1. Complete Meta Business Verification
2. Request `instagram_basic`, `pages_show_list` permissions
3. Submit app for review with screencast demo
4. Wait 2-4 weeks for approval
Note: Only works with Business/Creator Instagram accounts

## Test Credentials
- **Admin:** admin@adverlyx.com / Admin123!
- **User:** demo@user.com / User123!
- **Test User with AI Data:** aitest1769746586@test.com / Test123!
- **Admin Portal:** /backman

---

## Key API Endpoints

### Public
- `GET /api/public/settings` - Platform settings
- `GET /api/public/plans` - Pricing plans
- `GET /api/public/localized-pricing` - Localized prices

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/request-deletion` - GDPR data deletion

### Payments
- `POST /api/payments/checkout/session` - Stripe checkout
- `POST /api/payments/coupon/validate` - Validate coupon code
- `POST /api/payments/razorpay/create-order` - Razorpay order

### Instagram
- `POST /api/instagram/connect` - Manual connection
- `GET /api/instagram-api/oauth/authorize` - Start OAuth flow
- `GET /api/instagram-api/oauth/callback` - OAuth callback

### Admin
- `/api/admin/settings/*` - Platform settings CRUD
- `/api/admin/settings/email` - Email/SMTP settings (GET/PUT)
- `/api/admin/settings/email/test` - Send test email (POST)
- `/api/admin/plans/*` - Plan management
- `/api/admin/analytics/*` - Platform analytics
- `/api/admin/ai/*` - AI Intelligence endpoints
- `/api/admin/coupons/*` - Coupon management

---

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection string
- `DB_NAME` - Database name
- `STRIPE_API_KEY` - Stripe secret key
- `RAZORPAY_KEY_ID/SECRET` - Razorpay credentials
- `EMERGENT_LLM_KEY` - Universal LLM key
- `INSTAGRAM_APP_ID` - Facebook App ID (for OAuth)
- `INSTAGRAM_APP_SECRET` - Facebook App Secret
- `INSTAGRAM_REDIRECT_URI` - OAuth callback URL

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - Backend API URL
