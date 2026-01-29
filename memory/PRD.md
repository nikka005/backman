# Adverlyx Digital - Product Requirements Document

## Overview
Adverlyx Digital is a full-stack SaaS platform for Instagram growth services (plixi.io clone). The platform allows users to grow their Instagram followers organically through AI-powered targeting, while providing administrators full control over the platform's branding, features, and pricing without code changes.

## Core Features

### User-Facing
- Instagram account connection and growth tracking
- Multiple subscription plans with different follower guarantees
- Real-time analytics dashboard
- Support ticket system

### Admin Control Panel
- Full branding customization (colors, fonts, logos)
- Dynamic plan creation and management
- Feature matrix management
- Content management (hero text, FAQs, testimonials)
- User management and subscription controls

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

---

## Upcoming Tasks

### Phase 3: Advanced Analytics System (P1)
- [ ] User-level analytics dashboard (followers gained, engagement)
- [ ] Platform-level analytics (MRR, churn rate, active users)
- [ ] Growth engine metrics and performance tracking
- [ ] Revenue reporting and projections
- [ ] Export functionality for reports

### Phase 4: Promotion Planning System (P2)
- [ ] Ideal Customer Profile (ICP) targeting module
- [ ] A/B testing for marketing messages
- [ ] Content engine for automated posts
- [ ] Campaign management and scheduling
- [ ] Performance tracking by campaign

### Phase 5: Pre-Launch Hardening (P2)
- [ ] Security audit and vulnerability assessment
- [ ] Rate limiting implementation
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Documentation and deployment guides

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

### Database Collections
- `users` - User accounts and authentication
- `settings` - Platform configuration (singleton)
- `plans` - Subscription plans
- `feature_matrix` - Feature comparison data
- `subscriptions` - User subscriptions
- `instagram_accounts` - Connected IG accounts
- `tickets` - Support tickets

---

## API Endpoints Summary

### Public (No Auth)
- `GET /api/public/settings` - Platform settings
- `GET /api/public/plans` - Pricing plans
- `GET /api/public/feature-matrix` - Feature comparison
- `GET /api/public/faqs` - FAQ list
- `GET /api/public/testimonials` - Testimonials

### Admin
- `GET/PUT /api/admin/settings/` - All settings
- `GET/PUT /api/admin/settings/branding` - Branding only
- `GET/PUT /api/admin/settings/ui` - UI settings
- `GET/PUT /api/admin/settings/features` - Feature toggles
- `GET/PUT /api/admin/settings/hero` - Hero content
- `GET/PUT /api/admin/settings/stats` - Statistics
- `GET/POST/PUT/DELETE /api/admin/plans/` - Plan CRUD
- `GET/PUT /api/admin/plans/feature-matrix` - Feature matrix

---

## Credentials
- Admin: `admin@adverlyx.com` / `Admin123!`
- Test User: Create via signup page
