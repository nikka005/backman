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

## Implementation Status (Last Updated: January 30, 2026)

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

### In Progress
- **Instagram OAuth Live Deployment:** Code complete, blocked on user adding Facebook App credentials to AWS `.env`

### Upcoming Tasks (P1-P2)
1. Test Instagram OAuth end-to-end on live server after deployment
2. Final polish for beta launch
3. PayPal payment integration

### Future/Backlog (P3)
- AI-powered weekly growth reports
- AdminDashboard.jsx refactoring
- Full Onboarding Wizard (Option B)

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

### Token Fix ✅ (Jan 30, 2026)
- Fixed `localStorage.getItem('token')` → `localStorage.getItem('accessToken')`
- Applied to ConnectInstagramPage.jsx and AdminNotificationsManager.jsx


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
