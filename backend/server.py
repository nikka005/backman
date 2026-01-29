from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'adverlyx')]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI app."""
    # Startup: Initialize routes with database
    from routes import init_all_routes
    init_all_routes(db)
    
    # Create indexes for better query performance
    await create_indexes()
    
    logging.info("Application started successfully")
    yield
    
    # Shutdown
    client.close()
    logging.info("Application shutdown complete")


async def create_indexes():
    """Create database indexes for better performance."""
    try:
        # Users indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        await db.users.create_index("verification_token")
        await db.users.create_index("reset_token")
        
        # Subscriptions indexes
        await db.subscriptions.create_index("user_id")
        await db.subscriptions.create_index("status")
        await db.subscriptions.create_index([("user_id", 1), ("status", 1)])
        
        # Payments indexes
        await db.payments.create_index("user_id")
        await db.payments.create_index("status")
        await db.payments.create_index("created_at")
        
        # Instagram accounts indexes
        await db.instagram_accounts.create_index("user_id")
        await db.instagram_accounts.create_index("username")
        await db.instagram_accounts.create_index("status")
        
        # Targeting settings indexes
        await db.targeting_settings.create_index("user_id")
        await db.targeting_settings.create_index("instagram_account_id")
        
        # Growth logs indexes
        await db.growth_logs.create_index("user_id")
        await db.growth_logs.create_index("instagram_account_id")
        await db.growth_logs.create_index("created_at")
        
        # Tickets indexes
        await db.tickets.create_index("user_id")
        await db.tickets.create_index("status")
        await db.tickets.create_index("assigned_to")
        
        # Notifications indexes
        await db.notifications.create_index("user_id")
        await db.notifications.create_index("read")
        await db.notifications.create_index("created_at")
        
        # Admin logs indexes
        await db.admin_logs.create_index("admin_id")
        await db.admin_logs.create_index("action")
        await db.admin_logs.create_index("created_at")
        
        # CMS content indexes
        await db.cms_content.create_index("key", unique=True)
        
        logging.info("Database indexes created successfully")
    except Exception as e:
        logging.warning(f"Some indexes may already exist: {e}")


# Create the main app
app = FastAPI(
    title="Adverlyx Digital API",
    description="Instagram Growth Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "Adverlyx Digital API", "status": "healthy", "version": "1.0.0"}


@api_router.get("/health")
async def health_check():
    try:
        # Check database connection
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}


# Include the base router
app.include_router(api_router)

# Include all feature routers
from routes import all_routers
for router in all_routers:
    app.include_router(router, prefix="/api")


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Seed initial admin user if not exists
async def seed_admin():
    """Create initial admin user if not exists."""
    from utils.auth import hash_password
    from models.user import User, UserRole, UserStatus
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@adverlyx.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        admin = User(
            email=admin_email,
            name="Admin",
            password_hash=hash_password(admin_password),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            email_verified=True
        )
        admin_dict = admin.model_dump()
        admin_dict['created_at'] = admin_dict['created_at'].isoformat()
        admin_dict['updated_at'] = admin_dict['updated_at'].isoformat()
        await db.users.insert_one(admin_dict)
        logger.info(f"Admin user created: {admin_email}")


@app.on_event("startup")
async def startup_event():
    """Additional startup tasks."""
    await seed_admin()
