from .auth import router as auth_router, init_router as init_auth
from .instagram import router as instagram_router, init_router as init_instagram
from .subscriptions import router as subscriptions_router, init_router as init_subscriptions
from .tickets import router as tickets_router, init_router as init_tickets
from .notifications import router as notifications_router, init_router as init_notifications
from .admin import router as admin_router, init_router as init_admin
from .public import router as public_router, init_router as init_public


def init_all_routes(database):
    """Initialize all routes with database connection."""
    init_auth(database)
    init_instagram(database)
    init_subscriptions(database)
    init_tickets(database)
    init_notifications(database)
    init_admin(database)
    init_public(database)


all_routers = [
    auth_router,
    instagram_router,
    subscriptions_router,
    tickets_router,
    notifications_router,
    admin_router,
    public_router
]
