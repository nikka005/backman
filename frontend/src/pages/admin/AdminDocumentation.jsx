import React, { useState } from 'react';
import { 
  Book, Search, ChevronDown, ChevronRight, 
  LayoutDashboard, Brain, BarChart3, Megaphone, Gift, Users, Package, 
  Grid3X3, Sliders, CreditCard, DollarSign, Tag, Instagram, MessageSquare, 
  Bell, Mail, Shield, Download, Share2, Settings, RefreshCw, Globe, FileText, PieChart
} from 'lucide-react';
import { Input } from '../../components/ui/input';

const AdminDocumentation = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState(['getting-started']);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const documentationSections = [
    {
      id: 'getting-started',
      icon: Book,
      title: 'Getting Started',
      content: `
## Welcome to Adverlyx Admin Panel

This documentation covers all admin features and how to use them effectively.

### Quick Start
1. **Dashboard Overview** - View key metrics at a glance
2. **Manage Users** - Handle user accounts and subscriptions
3. **Configure Platform** - Customize settings, plans, and features
4. **Monitor Growth** - Track analytics and AI insights

### Admin Roles
- **Admin**: Full access to all features
- **Manager**: Limited access (no financial data)
      `
    },
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Dashboard Overview',
      content: `
## Dashboard Overview

The main dashboard shows real-time platform statistics.

### Key Metrics
- **Total Users**: All registered users on the platform
- **Active Subscriptions**: Currently paying customers
- **MRR (Monthly Recurring Revenue)**: Total monthly revenue from subscriptions
- **Open Tickets**: Unresolved support requests

### Actions
- Click **Refresh** to update statistics
- Use quick actions to navigate to specific sections
      `
    },
    {
      id: 'ai-intelligence',
      icon: Brain,
      title: 'AI Intelligence',
      content: `
## AI Intelligence Module

Powered by GPT-5.2 and Claude Sonnet 4.5 for intelligent decision support.

### Features

#### AI Chat
- Ask questions about platform performance
- Get recommendations for growth strategies
- Analyze user behavior patterns

#### Growth Planning
- Generate personalized growth plans for users
- Set targets and milestones
- Approve or modify AI-generated plans

#### Analytics Analysis
- Run AI analysis on platform metrics
- Identify trends and anomalies
- Get actionable recommendations

#### Risk Assessment
- Platform-wide risk analysis
- User-specific risk evaluation
- Mitigation recommendations

### Settings
- Enable/disable specific AI modules
- View LLM provider status
- Monitor AI activity logs
      `
    },
    {
      id: 'charts-traffic',
      icon: PieChart,
      title: 'Charts & Traffic',
      content: `
## Charts & Traffic Analytics

Visual analytics dashboard with real-time statistics.

### Access
Navigate to: **Admin Panel → Charts & Traffic**

### Features

#### Real-time Stats
- Current visitors online
- Active users (last hour)
- Recent signups
- Page views
- Revenue

#### Charts Available
- **Revenue Chart**: Daily revenue trend with growth %
- **User Growth**: New users and cumulative growth
- **Traffic Chart**: Page views and unique visitors
- **Traffic Sources**: Organic, Direct, Social, Referral, Paid
- **Conversion Funnel**: Visitors → Signups → Trials → Paid
- **Geographic**: Users by country
- **Top Pages**: Most visited pages with bounce rate

### Time Periods
Select 7 days, 30 days, or 90 days for chart data.

### Note
Traffic data is simulated for demo. Integrate Google Analytics for real data.
      `
    },
    {
      id: 'refunds',
      icon: DollarSign,
      title: 'Refund Management',
      content: `
## Refund Management

Handle customer refund requests with approval workflow.

### Access
Navigate to: **Admin Panel → Refunds**

### Dashboard Stats
- **Pending**: Awaiting review
- **Processed**: Completed refunds
- **Total Refunded**: Lifetime amount
- **Refund Rate**: Percentage of payments refunded

### Workflow
1. Customer submits refund request
2. Admin reviews request details
3. Admin approves or rejects
4. Process approved refunds
5. Customer receives email notification

### Actions
- **View**: See refund details and reason
- **Approve**: Accept the refund request
- **Reject**: Deny with admin notes
- **Process**: Execute approved refund

### Refund Types
- **Full Refund**: 100% of payment (cancels subscription)
- **Partial Refund**: Custom amount
      `
    },
    {
      id: 'renewals',
      icon: RefreshCw,
      title: 'Subscription Renewals',
      content: `
## Subscription Renewals

Manage automatic subscription renewals.

### Access
Navigate to: **Admin Panel → Renewals**

### Tabs
- **Due Now**: Subscriptions needing immediate renewal
- **Upcoming**: Renewals in next 7-14 days
- **History**: Past renewal attempts

### Settings
Click Settings button to configure:
- Auto-Renewal: Enable/disable automatic processing
- Max Retry Attempts: Retries for failed payments (default: 3)
- Retry Interval: Days between retries (default: 1)
- Grace Period: Days before cancellation (default: 7)

### Actions
- **Process Single**: Renew one subscription
- **Process All Due**: Batch process all due renewals

### Email Notifications
- Renewal success confirmation
- Payment failed warning
- Subscription cancelled notice
      `
    },
    {
      id: 'languages',
      icon: Globe,
      title: 'Multi-language (i18n)',
      content: `
## Multi-language Support

Configure platform languages and translations.

### Access
Navigate to: **Admin Panel → Languages**

### Supported Languages
14 languages: English, Spanish, French, German, Portuguese, Italian, Dutch, Russian, Japanese, Korean, Chinese, Arabic (RTL), Hindi, Turkish

### Settings Panel
- **Default Language**: Primary site language
- **Auto-Detect**: Detect from browser
- **Enabled Languages**: Toggle languages on/off

### Translation Editor
- Search by key or value
- Edit translations inline
- Organized by category (nav, hero, pricing, auth, dashboard, common, errors, footer)

### How to Edit
1. Select language from dropdown
2. Search or browse translations
3. Click edit icon on any translation
4. Update value and save
      `
    },
    {
      id: 'invoices',
      icon: FileText,
      title: 'Invoice Generation',
      content: `
## Invoice Generation

Generate professional invoices for payments.

### Features
- Professional invoice layout
- PDF download option
- Automatic invoice numbering
- Company branding included

### Invoice Contains
- Invoice number (INV-YYYYMM-XXXXX)
- Customer name and email
- Payment date and method
- Plan name and billing cycle
- Amount breakdown

### Access Invoices
- **Users**: View their invoices from dashboard billing section
- **Admin**: View all invoices from Payments page

### Formats
- HTML: View in browser
- PDF: Download file
      `
    },
    {
      id: 'affiliate-dashboard',
      icon: Gift,
      title: 'Affiliate Dashboard',
      content: `
## Affiliate Dashboard

User-facing partner program dashboard.

### Access
URL: /affiliate/dashboard (for users)

### Tabs

#### Overview
- Referral link with copy/share
- Quick stats cards
- Program comparison

#### Referral Program (All Users)
- Share link, earn $10 credit
- Friends get 20% off first month
- No limit on referrals
- Track referrals and rewards

#### Affiliate Program (Approved Only)
- 20% commission on sales
- 30-day cookie duration
- $50 minimum payout
- Monthly payouts

### Stats Displayed
- Total Referrals
- Successful Referrals
- Pending Rewards
- Total Earned

### How It Works
1. User shares referral link
2. Friend signs up and subscribes
3. User gets $10 credit
4. Friend gets 20% off
      `
    },
    {
      id: 'google-analytics',
      icon: BarChart3,
      title: 'Google Analytics Integration',
      content: `
## Google Analytics Integration

Connect GA4 for real website traffic data in your admin dashboard.

### Access
Navigate to: **Admin Panel → Google Analytics**

### Current Status
- ⚠️ **Not Configured**: Traffic data in Charts & Traffic page shows SIMULATED data
- ✅ **Configured**: Real-time data from your GA4 property

### Setup Steps
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Analytics Data API**
4. Go to IAM & Admin → Service Accounts
5. Create a Service Account (e.g., "adverlyx-ga-reader")
6. Download JSON key file
7. Go to your GA4 property → Admin → Property Access Management
8. Add the service account email with **Viewer** role
9. Upload JSON key in Adverlyx Admin Panel

### Configuration Fields
- **GA4 Property ID**: Your property ID (e.g., "properties/123456789")
- **Property Name**: Friendly name for identification
- **Service Account JSON**: The downloaded credentials file

### Data Available (When Configured)
- **Real-time**: Current visitors, page views/hour
- **Traffic Sources**: Organic, Direct, Social, Referral breakdown
- **Top Pages**: Most visited pages with bounce rates
- **Geographic**: Users by country
- **User Metrics**: Sessions, new users, returning users

### Integration with Charts
Once configured, the **Charts & Traffic** page will:
- Show green "Google Analytics Connected" banner
- Display "Live GA4" badges on charts using real data
- Remove the yellow "simulated data" warning

### Requirements
- GA4 Property (Universal Analytics not supported)
- Service Account with Viewer access
- Google Analytics Data API enabled
- Valid JSON credentials file

### Troubleshooting
- **"Invalid credentials"**: Re-download JSON from Google Cloud
- **"Permission denied"**: Ensure service account has Viewer role in GA4
- **"API not enabled"**: Enable Analytics Data API in Cloud Console
      `
    },
    {
      id: 'growth-engine',
      icon: Sliders,
      title: 'Growth Engine (Safe Mode)',
      content: `
## Adverlyx Growth Engine - Safe Mode

100% Custom-built Instagram growth system using a **safe, compliant approach**.

### ⚠️ Important: Safe Approach
This Growth Engine does NOT automate actions on Instagram. Instead, it:
1. **Analyzes** your account using Instagram Graph API (read-only)
2. **Suggests** target accounts using AI
3. **You engage** manually on Instagram

This approach is 100% safe and compliant with Instagram's Terms of Service.

### Access
- **Admin**: Admin Panel → Growth Engine
- **Users**: Dashboard → Growth Engine (requires subscription)

### How It Works

#### 1. Analytics (Instagram Graph API)
- Connect Instagram Business/Creator account via OAuth
- View follower growth trends
- Track engagement rates
- Monitor profile visits and reach

#### 2. AI-Powered Targeting
- Enter target hashtags, niches, and competitor accounts
- AI analyzes your criteria
- Generates smart suggestions for accounts to engage with
- Prioritizes high-quality targets

#### 3. Manual Engagement
- Review AI suggestions in the dashboard
- Go to Instagram and engage manually
- Like posts, leave genuine comments, follow accounts
- Log your actions to track effectiveness

### Admin Panel Features

#### Stats Dashboard
- Active Campaigns: Currently running campaigns
- Total Campaigns: All campaigns created
- AI Suggestions: Total suggestions generated
- Manual Actions: User-logged engagements

#### AI Targeting Configuration
- **Daily Suggestions**: Number of suggestions per day (default: 50)
- **Targeting Accuracy**: Low/Medium/High quality filtering
- **Min Followers**: Minimum follower count (default: 100)
- **Max Followers**: Maximum follower count (default: 50,000)
- **Exclude Private**: Skip private accounts
- **Exclude Business**: Skip business accounts

#### Campaign Management
- View all user campaigns
- Monitor campaign status (active/paused)
- See targeting criteria and stats
- Batch operations for admin

### User Flow

1. **Create Campaign**: Enter Instagram username and targeting criteria
2. **Set Targeting**: Add hashtags, niches, locations, competitors
3. **Get Suggestions**: Click "Get AI Suggestions" button
4. **Manual Engage**: Review suggestions and engage on Instagram
5. **Log Actions**: Record follows, likes, comments in the app
6. **Track Results**: Monitor growth over time

### AI Suggestion Format
Each suggestion includes:
- **Account Type**: Category of accounts to target
- **Search Strategy**: How to find these accounts
- **Hashtags to Explore**: Relevant hashtags to browse
- **Engagement Tip**: Best practice for engaging
- **Priority**: High/Medium/Low importance

### Why Safe Mode?
- ✅ No risk of Instagram ban
- ✅ Compliant with Instagram ToS
- ✅ Builds genuine engagement
- ✅ Better long-term results
- ✅ No automation detection risk

### Requirements
- Active Adverlyx subscription
- Instagram Business or Creator account (for analytics)
- Manual engagement on Instagram app
      `
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Analytics',
      content: `
## Platform Analytics

Comprehensive analytics for monitoring platform health.

### Metrics

#### Revenue Metrics
- **MRR**: Monthly Recurring Revenue
- **ARR**: Annual Recurring Revenue
- **ARPU**: Average Revenue Per User
- **ARPPU**: Average Revenue Per Paying User

#### User Metrics
- Total users and growth rate
- Active users (daily/monthly)
- New registrations
- Churn rate

#### Conversion Funnel
- Visitors → Signups → Trial → Paid
- Conversion rates at each stage
- Geographic distribution

### Time Periods
Select from: 7 days, 30 days, 90 days, or custom range
      `
    },
    {
      id: 'promotions',
      icon: Megaphone,
      title: 'Promotions',
      content: `
## Promotion Planning System

Manage marketing campaigns and customer targeting.

### ICP (Ideal Customer Profiles)
Create profiles for different customer segments:
- Demographics (age, location, income)
- Behavior patterns
- Interests and goals
- Pain points

### A/B Testing
- Create test variants for messaging
- Track performance metrics
- Select winning variants
- Apply learnings platform-wide

### Campaigns
- Create targeted campaigns
- Schedule launch dates
- Track engagement metrics
- Measure ROI
      `
    },
    {
      id: 'programs',
      icon: Gift,
      title: 'Partner Programs',
      content: `
## Affiliate & Referral Programs

Manage partnership and referral incentives.

### Affiliate Program
- **Applications**: Review and approve affiliate applications
- **Commission Rates**: Set custom rates per affiliate
- **Payouts**: Process pending payouts
- **Performance**: Track clicks, conversions, revenue

### Settings
- Commission rate (default %)
- Cookie duration (days)
- Minimum payout threshold

### Referral Program
- **Referrals**: View all user referrals
- **Complete**: Mark referrals as complete and credit rewards
- **Stats**: Total referrals, completed, pending

### Settings
- Referrer reward amount
- Referee discount
- Subscription requirement toggle
      `
    },
    {
      id: 'users',
      icon: Users,
      title: 'User Management',
      content: `
## User Management

View and manage all platform users.

### Features
- **Search**: Find users by name or email
- **Filter**: Filter by status (active/suspended)
- **View Details**: Full user profile and activity

### Actions
- **Activate/Suspend**: Change user status
- **View Details**: See subscription, 2FA status, join date
- **Reset Password**: Trigger password reset email

### User Data Displayed
- Name and email
- Role (user/admin/manager)
- Account status
- Join date
- Subscription status
      `
    },
    {
      id: 'plans',
      icon: Package,
      title: 'Plans Management',
      content: `
## Subscription Plans

Create and manage pricing plans.

### Plan Properties
- **Name**: Display name (Basic, Pro, Enterprise)
- **Slug**: URL-friendly identifier
- **Description**: Plan description shown to users
- **Pricing**: Monthly and yearly prices
- **Follower Range**: Min/max followers per month
- **Features**: List of included features

### Actions
- **Create**: Add new subscription plans
- **Edit**: Modify existing plans
- **Delete**: Remove plans (careful - affects subscribers)
- **Set Popular**: Mark a plan as "Most Popular"

### Best Practices
- Keep 3-4 plans maximum
- Clear feature differentiation
- Psychological pricing ($49, $99)
      `
    },
    {
      id: 'feature-matrix',
      icon: Grid3X3,
      title: 'Feature Matrix',
      content: `
## Feature Comparison Matrix

Manage the feature comparison table shown on pricing page.

### Categories
- **Growth**: Follower guarantees, targeting
- **Targeting**: AI targeting, locations, hashtags
- **Support**: Response time, dedicated manager
- **Analytics**: Dashboard access, reports
- **Advanced**: API access, custom strategies

### Feature Types
- **Boolean**: Yes/No (checkmark or X)
- **Custom Value**: Specific text (e.g., "1000-1500")

### Display
Features appear in the comparison table under each plan.
      `
    },
    {
      id: 'feature-manager',
      icon: Sliders,
      title: 'Feature Manager',
      content: `
## Enterprise Feature Management

Fine-grained control over all platform features.

### Pages
Manage individual page configurations:
- SEO settings (title, description)
- Navigation visibility
- Access control (public/auth required)
- Publish/Draft status

### Sections
Control UI sections:
- Content and styling
- Display order
- Enable/disable

### Platform Features
Toggle platform capabilities:
- AI features
- Growth engine
- Analytics
- Usage limits

### Payment Options
Configure payment providers:
- Stripe (USD)
- Razorpay (INR)
- PayPal (future)
- API credentials

### Authentication
Manage auth methods:
- Email/password
- Google OAuth
- 2FA settings
      `
    },
    {
      id: 'subscriptions',
      icon: CreditCard,
      title: 'Subscriptions',
      content: `
## Subscription Management

View and manage all user subscriptions.

### Features
- **List View**: All subscriptions with status
- **Change Plan**: Upgrade/downgrade user plans
- **Cancel**: Cancel active subscriptions

### Subscription Data
- User information
- Plan name and billing cycle
- Status (active, cancelled, expired)
- Start and end dates
- Amount

### Actions
- View subscription details
- Change to different plan
- Cancel subscription
- View payment history
      `
    },
    {
      id: 'payments',
      icon: DollarSign,
      title: 'Payments',
      content: `
## Payment Management

Track and manage all platform transactions.

### Statistics
- **Total Revenue**: Lifetime earnings
- **This Month**: Current month revenue
- **Pending**: Awaiting payment processing

### Payment Records
- Transaction ID
- User details
- Amount and currency
- Payment method (Stripe/Razorpay)
- Status and date

### Actions
- **Refund**: Process partial or full refunds
- **View Details**: Full transaction information
- **Export**: Download payment data
      `
    },
    {
      id: 'coupons',
      icon: Tag,
      title: 'Coupon Management',
      content: `
## Promotional Coupons

Create and manage discount codes.

### Coupon Properties
- **Code**: Unique coupon code (auto-uppercased)
- **Description**: Internal note about the coupon
- **Discount**: Percentage off (1-100%)
- **Max Uses**: Limit on total redemptions
- **Valid Plans**: Restrict to specific plans
- **Expiry Date**: When coupon expires

### Statistics
- Total coupons created
- Active coupons
- Total redemptions
- Average discount given

### Actions
- Create new coupons
- Edit existing coupons
- Delete coupons
- View usage statistics

### Example Coupons
- WELCOME20 - 20% off for new users
- ANNUAL50 - 50% off yearly plans
      `
    },
    {
      id: 'instagram',
      icon: Instagram,
      title: 'Instagram Accounts',
      content: `
## Instagram Account Management

Manage connected Instagram accounts.

### Account Data
- Username and profile info
- Followers and engagement
- Connection type (OAuth or Manual)
- Growth status (active/paused)

### Actions
- **Pause/Resume Growth**: Toggle AI growth engine
- **View Stats**: See account performance
- **Disconnect**: Remove account connection

### OAuth vs Manual
- **OAuth**: Real data from Instagram API
- **Manual**: Simulated data for demo/testing
      `
    },
    {
      id: 'tickets',
      icon: MessageSquare,
      title: 'Support Tickets',
      content: `
## Support Ticket Management

Handle customer support requests.

### Ticket Status
- **Open**: Awaiting response
- **In Progress**: Being handled
- **Resolved**: Issue fixed
- **Closed**: No further action needed

### Actions
- **Reply**: Send response to customer
- **Change Status**: Update ticket status
- **Mark Resolved**: Close with resolution
- **Escalate**: Mark as high priority

### Best Practices
- Respond within 24 hours
- Be professional and helpful
- Document resolutions for FAQ
      `
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      content: `
## Broadcast Notifications

Send announcements to users.

### Notification Types
- **System**: Platform updates
- **Payment**: Billing related
- **Subscription**: Plan changes
- **Growth**: Growth milestones
- **Support**: Ticket updates
- **Promotion**: Marketing messages

### Targeting
- All users
- Specific plan holders (Basic, Pro, Enterprise)

### Priority Levels
- Low, Normal, High

### Features
- Real-time WebSocket delivery
- In-app notification center
- Email notifications (configurable)
      `
    },
    {
      id: 'email-templates',
      icon: Mail,
      title: 'Email Templates',
      content: `
## Email Template Customization

Customize transactional emails.

### Available Templates
1. **Welcome**: New user registration
2. **Payment Confirmation**: Successful payment
3. **Password Reset**: Reset password link
4. **Subscription Update**: Plan changes
5. **Payment Failed**: Failed payment notice

### Editing
- Visual HTML editor
- Live preview
- Variable placeholders:
  - {{name}} - User's name
  - {{plan}} - Plan name
  - {{amount}} - Payment amount
  - {{date}} - Relevant date

### Actions
- Edit template content
- Send test email
- Reset to default
      `
    },
    {
      id: 'rate-limits',
      icon: Shield,
      title: 'Rate Limits',
      content: `
## API Rate Limiting

Protect the platform from abuse.

### Configurable Endpoints
- auth_login: 5 requests/minute
- auth_register: 3 requests/5 minutes
- password_reset: 3 requests/5 minutes
- payment: 10 requests/minute
- api_general: 100 requests/minute
- instagram_connect: 5 requests/minute
- ticket_create: 10 requests/minute

### Monitoring
- Requests today
- Requests last hour
- Blocked requests
- Block rate percentage

### Blocked IPs
- View blocked IP addresses
- Unblock specific IPs
- Manually block suspicious IPs
      `
    },
    {
      id: 'export',
      icon: Download,
      title: 'Data Export',
      content: `
## Data Export System

Export platform data for analysis.

### Export Types
- **Users**: All user data
- **Subscriptions**: Subscription records
- **Payments**: Transaction history
- **Analytics**: Platform metrics
- **Instagram Accounts**: Connected accounts
- **Tickets**: Support ticket history
- **Funnel Events**: Conversion tracking
- **Growth Logs**: Growth activity

### Formats
- CSV (spreadsheet compatible)
- JSON (developer friendly)

### Time Periods
- Last 7 days
- Last 30 days
- Last 90 days
- Last 365 days

### Full Report
Generate comprehensive platform report in JSON format.
      `
    },
    {
      id: 'social-links',
      icon: Share2,
      title: 'Social Links',
      content: `
## Social Media Links

Configure footer social media links.

### Supported Platforms
- Instagram
- Twitter/X
- LinkedIn
- YouTube
- Facebook
- TikTok
- Pinterest
- Discord
- Telegram

### Configuration
- Enter URL for each platform
- Leave empty to hide platform
- Preview changes before saving
- Links appear in site footer
      `
    },
    {
      id: 'settings',
      icon: Settings,
      title: 'Platform Settings',
      content: `
## Platform Settings

Core platform configuration.

### Branding
- Logo upload
- Primary colors
- Font selection
- Favicon

### UI Settings
- Theme (light/dark)
- Layout options
- Animation settings

### Feature Toggles
- Enable/disable platform features
- Show/hide pages
- Toggle functionality

### Content
- Hero section text
- Statistics display
- Promo banner settings
- Countdown timers

### Best Practices
- Use Live Preview before saving
- Test on mobile devices
- Keep branding consistent
      `
    }
  ];

  const filteredSections = documentationSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Book className="w-7 h-7 text-pink-500" />
          Admin Documentation
        </h1>
        <p className="text-gray-500 mt-1">Complete guide to all admin panel features</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Documentation Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.includes(section.id);
          
          return (
            <div key={section.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900">{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-6 pb-6 border-t">
                  <div className="prose prose-sm max-w-none mt-4">
                    {section.content.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2">{line.replace('## ', '')}</h2>;
                      } else if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
                      } else if (line.startsWith('#### ')) {
                        return <h4 key={i} className="text-md font-semibold text-gray-700 mt-3 mb-1">{line.replace('#### ', '')}</h4>;
                      } else if (line.startsWith('- **')) {
                        const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
                        if (match) {
                          return (
                            <div key={i} className="flex items-start gap-2 my-1">
                              <span className="text-pink-500 mt-1">•</span>
                              <span><strong className="text-gray-900">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ''}</span>
                            </div>
                          );
                        }
                      } else if (line.startsWith('- ')) {
                        return (
                          <div key={i} className="flex items-start gap-2 my-1">
                            <span className="text-pink-500 mt-1">•</span>
                            <span className="text-gray-600">{line.replace('- ', '')}</span>
                          </div>
                        );
                      } else if (line.match(/^\d+\./)) {
                        return <p key={i} className="text-gray-600 my-1 pl-4">{line}</p>;
                      } else if (line.trim()) {
                        return <p key={i} className="text-gray-600 my-2">{line}</p>;
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No documentation found for &quot;{searchTerm}&quot;</p>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentation;
