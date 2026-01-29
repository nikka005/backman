from .auth import router as auth_router, init_router as init_auth
from .instagram import router as instagram_router, init_router as init_instagram
from .subscriptions import router as subscriptions_router, init_router as init_subscriptions
from .tickets import router as tickets_router, init_router as init_tickets
from .notifications import router as notifications_router, init_router as init_notifications
from .admin import router as admin_router, init_router as init_admin
from .public import router as public_router, init_router as init_public
from .admin_settings import router as admin_settings_router, init_router as init_admin_settings
from .admin_plans import router as admin_plans_router, init_router as init_admin_plans
from .admin_analytics import router as admin_analytics_router, init_router as init_admin_analytics
from .admin_promotions import router as admin_promotions_router, init_router as init_admin_promotions
from .payments import router as payments_router, init_router as init_payments
from .razorpay_payments import router as razorpay_router, init_router as init_razorpay
from .webhooks import router as webhooks_router, init_router as init_webhooks
from .two_factor import router as two_factor_router, init_router as init_two_factor
from .feature_management import router as feature_management_router, init_router as init_feature_management
from .admin_email_templates import router as email_templates_router, init_router as init_email_templates
from .push_notifications import router as push_notifications_router, init_router as init_push_notifications
from .admin_rate_limits import router as rate_limits_router, init_router as init_rate_limits
from .admin_export import router as export_router, init_router as init_export
from .ai_intelligence import router as ai_intelligence_router, init_router as init_ai_intelligence
from .ai_onboarding import router as ai_onboarding_router, init_router as init_ai_onboarding


def init_all_routes(database):
    """Initialize all routes with database connection."""
    init_auth(database)
    init_instagram(database)
    init_subscriptions(database)
    init_tickets(database)
    init_notifications(database)
    init_admin(database)
    init_public(database)
    init_admin_settings(database)
    init_admin_plans(database)
    init_admin_analytics(database)
    init_admin_promotions(database)
    init_payments(database)
    init_razorpay(database)
    init_webhooks(database)
    init_two_factor(database)
    init_feature_management(database)
    init_email_templates(database)
    init_push_notifications(database)
    init_rate_limits(database)
    init_export(database)
    init_ai_intelligence(database)
    init_ai_onboarding(database)


all_routers = [
    auth_router,
    instagram_router,
    subscriptions_router,
    tickets_router,
    notifications_router,
    admin_router,
    public_router,
    admin_settings_router,
    admin_plans_router,
    admin_analytics_router,
    admin_promotions_router,
    payments_router,
    razorpay_router,
    webhooks_router,
    two_factor_router,
    feature_management_router,
    email_templates_router,
    push_notifications_router,
    rate_limits_router,
    export_router,
    ai_intelligence_router
]
