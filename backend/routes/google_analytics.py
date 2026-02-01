"""
Google Analytics 4 Integration
Real traffic data from GA4 for admin dashboard
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List, Any
import logging
import json
import os

from utils.auth import get_current_user
from models.user import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/google-analytics", tags=["Google Analytics"])

db = None

def init_router(database):
    global db
    db = database


# ============== Models ==============

class GACredentialsUpload(BaseModel):
    property_id: str
    property_name: str


class DateRangeRequest(BaseModel):
    days: int = Field(default=30, ge=1, le=365)


# ============== GA4 Service ==============

class GA4AnalyticsService:
    def __init__(self, credentials_dict: dict):
        try:
            from google.analytics.data_v1beta import BetaAnalyticsDataClient
            from google.oauth2 import service_account
            
            credentials = service_account.Credentials.from_service_account_info(credentials_dict)
            self.client = BetaAnalyticsDataClient(credentials=credentials)
            self.available = True
        except Exception as e:
            logger.error(f"Failed to initialize GA4 client: {e}")
            self.client = None
            self.available = False
    
    async def get_page_views(self, property_id: str, start_date: str, end_date: str) -> Dict:
        if not self.available:
            return {"error": "GA4 client not available"}
        
        try:
            from google.analytics.data_v1beta.types import (
                RunReportRequest, Dimension, Metric, DateRange
            )
            
            request = RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                metrics=[Metric(name="screenPageViews")],
                dimensions=[Dimension(name="date")]
            )
            response = self.client.run_report(request)
            
            data = []
            for row in response.rows:
                data.append({
                    "date": row.dimension_values[0].value,
                    "page_views": int(row.metric_values[0].value)
                })
            
            return {
                "total": sum(d["page_views"] for d in data),
                "data_points": sorted(data, key=lambda x: x["date"])
            }
        except Exception as e:
            logger.error(f"GA4 page views error: {e}")
            return {"error": str(e)}
    
    async def get_sessions_and_users(self, property_id: str, start_date: str, end_date: str) -> Dict:
        if not self.available:
            return {"error": "GA4 client not available"}
        
        try:
            from google.analytics.data_v1beta.types import (
                RunReportRequest, Dimension, Metric, DateRange
            )
            
            request = RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                metrics=[Metric(name="sessions"), Metric(name="activeUsers")],
                dimensions=[Dimension(name="date")]
            )
            response = self.client.run_report(request)
            
            data = []
            for row in response.rows:
                data.append({
                    "date": row.dimension_values[0].value,
                    "sessions": int(row.metric_values[0].value),
                    "active_users": int(row.metric_values[1].value)
                })
            
            return {
                "total_sessions": sum(d["sessions"] for d in data),
                "total_users": sum(d["active_users"] for d in data),
                "data_points": sorted(data, key=lambda x: x["date"])
            }
        except Exception as e:
            logger.error(f"GA4 sessions error: {e}")
            return {"error": str(e)}
    
    async def get_bounce_rate(self, property_id: str, start_date: str, end_date: str) -> Dict:
        if not self.available:
            return {"error": "GA4 client not available"}
        
        try:
            from google.analytics.data_v1beta.types import (
                RunReportRequest, Metric, DateRange
            )
            
            request = RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                metrics=[Metric(name="bounceRate"), Metric(name="engagementRate")]
            )
            response = self.client.run_report(request)
            
            if response.rows:
                row = response.rows[0]
                return {
                    "bounce_rate": float(row.metric_values[0].value) * 100,
                    "engagement_rate": float(row.metric_values[1].value) * 100
                }
            return {"bounce_rate": 0, "engagement_rate": 0}
        except Exception as e:
            logger.error(f"GA4 bounce rate error: {e}")
            return {"error": str(e)}
    
    async def get_traffic_sources(self, property_id: str, start_date: str, end_date: str) -> Dict:
        if not self.available:
            return {"error": "GA4 client not available"}
        
        try:
            from google.analytics.data_v1beta.types import (
                RunReportRequest, Dimension, Metric, DateRange, OrderBy
            )
            
            request = RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimensions=[Dimension(name="sessionDefaultChannelGroup")],
                metrics=[Metric(name="sessions")],
                order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)]
            )
            response = self.client.run_report(request)
            
            data = []
            total = 0
            for row in response.rows:
                sessions = int(row.metric_values[0].value)
                total += sessions
                data.append({
                    "channel": row.dimension_values[0].value,
                    "sessions": sessions
                })
            
            # Calculate percentages
            for item in data:
                item["percentage"] = round((item["sessions"] / total * 100), 1) if total > 0 else 0
            
            return {"traffic_sources": data, "total_sessions": total}
        except Exception as e:
            logger.error(f"GA4 traffic sources error: {e}")
            return {"error": str(e)}
    
    async def get_geographic_data(self, property_id: str, start_date: str, end_date: str) -> Dict:
        if not self.available:
            return {"error": "GA4 client not available"}
        
        try:
            from google.analytics.data_v1beta.types import (
                RunReportRequest, Dimension, Metric, DateRange, OrderBy
            )
            
            request = RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimensions=[Dimension(name="country")],
                metrics=[Metric(name="activeUsers"), Metric(name="sessions")],
                order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="activeUsers"), desc=True)],
                limit=20
            )
            response = self.client.run_report(request)
            
            data = []
            for row in response.rows:
                data.append({
                    "country": row.dimension_values[0].value,
                    "active_users": int(row.metric_values[0].value),
                    "sessions": int(row.metric_values[1].value)
                })
            
            return {"countries": data}
        except Exception as e:
            logger.error(f"GA4 geographic error: {e}")
            return {"error": str(e)}
    
    async def get_top_pages(self, property_id: str, start_date: str, end_date: str, limit: int = 10) -> Dict:
        if not self.available:
            return {"error": "GA4 client not available"}
        
        try:
            from google.analytics.data_v1beta.types import (
                RunReportRequest, Dimension, Metric, DateRange, OrderBy
            )
            
            request = RunReportRequest(
                property=f"properties/{property_id}",
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimensions=[Dimension(name="pagePath"), Dimension(name="pageTitle")],
                metrics=[
                    Metric(name="screenPageViews"),
                    Metric(name="bounceRate"),
                    Metric(name="averageSessionDuration")
                ],
                order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)],
                limit=limit
            )
            response = self.client.run_report(request)
            
            data = []
            for row in response.rows:
                data.append({
                    "path": row.dimension_values[0].value,
                    "title": row.dimension_values[1].value,
                    "views": int(row.metric_values[0].value),
                    "bounce_rate": round(float(row.metric_values[1].value) * 100, 1),
                    "avg_duration": round(float(row.metric_values[2].value), 1)
                })
            
            return {"top_pages": data}
        except Exception as e:
            logger.error(f"GA4 top pages error: {e}")
            return {"error": str(e)}


# ============== Helper Functions ==============

def calculate_date_range(days: int):
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)
    return start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d")


async def get_ga4_service():
    """Get GA4 service with credentials from database."""
    creds = await db.ga4_credentials.find_one({"is_active": True}, {"_id": 0})
    if not creds:
        return None
    
    credentials_dict = {
        "type": "service_account",
        "project_id": creds.get("project_id"),
        "private_key_id": creds.get("private_key_id", ""),
        "private_key": creds.get("private_key"),
        "client_email": creds.get("service_account_email"),
        "client_id": creds.get("client_id", ""),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
    }
    
    return GA4AnalyticsService(credentials_dict), creds.get("property_id")


# ============== API Endpoints ==============

@router.post("/credentials/upload")
async def upload_ga4_credentials(
    file: UploadFile = File(...),
    property_id: str = Form(...),
    property_name: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload GA4 service account credentials (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        content = await file.read()
        creds_json = json.loads(content.decode())
        
        # Validate required fields
        required_fields = ['client_email', 'private_key', 'project_id']
        missing = [f for f in required_fields if f not in creds_json]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing fields: {', '.join(missing)}")
        
        # Deactivate previous credentials
        await db.ga4_credentials.update_many({}, {"$set": {"is_active": False}})
        
        # Store new credentials
        await db.ga4_credentials.insert_one({
            "service_account_email": creds_json.get("client_email"),
            "private_key": creds_json.get("private_key"),
            "private_key_id": creds_json.get("private_key_id"),
            "project_id": creds_json.get("project_id"),
            "client_id": creds_json.get("client_id"),
            "property_id": property_id,
            "property_name": property_name,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user["user_id"]
        })
        
        return {"message": "GA4 credentials uploaded successfully", "property_name": property_name}
    
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        logger.error(f"Error uploading GA4 credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/credentials/status")
async def get_credentials_status(current_user: dict = Depends(get_current_user)):
    """Get GA4 credentials status."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    creds = await db.ga4_credentials.find_one({"is_active": True}, {"_id": 0, "private_key": 0})
    
    if not creds:
        return {"configured": False, "message": "No GA4 credentials configured"}
    
    return {
        "configured": True,
        "property_id": creds.get("property_id"),
        "property_name": creds.get("property_name"),
        "service_account_email": creds.get("service_account_email"),
        "created_at": creds.get("created_at")
    }


@router.delete("/credentials")
async def delete_credentials(current_user: dict = Depends(get_current_user)):
    """Delete GA4 credentials (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.ga4_credentials.delete_many({})
    return {"message": "GA4 credentials deleted"}


@router.get("/data/page-views")
async def get_page_views(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get page views data."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await get_ga4_service()
    if not result:
        raise HTTPException(status_code=404, detail="GA4 not configured")
    
    service, property_id = result
    start_date, end_date = calculate_date_range(days)
    data = await service.get_page_views(property_id, start_date, end_date)
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    return data


@router.get("/data/sessions-users")
async def get_sessions_users(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get sessions and users data."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await get_ga4_service()
    if not result:
        raise HTTPException(status_code=404, detail="GA4 not configured")
    
    service, property_id = result
    start_date, end_date = calculate_date_range(days)
    data = await service.get_sessions_and_users(property_id, start_date, end_date)
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    return data


@router.get("/data/bounce-rate")
async def get_bounce_rate(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get bounce rate data."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await get_ga4_service()
    if not result:
        raise HTTPException(status_code=404, detail="GA4 not configured")
    
    service, property_id = result
    start_date, end_date = calculate_date_range(days)
    data = await service.get_bounce_rate(property_id, start_date, end_date)
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    return data


@router.get("/data/traffic-sources")
async def get_traffic_sources(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get traffic sources data."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await get_ga4_service()
    if not result:
        raise HTTPException(status_code=404, detail="GA4 not configured")
    
    service, property_id = result
    start_date, end_date = calculate_date_range(days)
    data = await service.get_traffic_sources(property_id, start_date, end_date)
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    return data


@router.get("/data/geographic")
async def get_geographic(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get geographic data."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await get_ga4_service()
    if not result:
        raise HTTPException(status_code=404, detail="GA4 not configured")
    
    service, property_id = result
    start_date, end_date = calculate_date_range(days)
    data = await service.get_geographic_data(property_id, start_date, end_date)
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    return data


@router.get("/data/top-pages")
async def get_top_pages(days: int = 30, limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Get top pages data."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await get_ga4_service()
    if not result:
        raise HTTPException(status_code=404, detail="GA4 not configured")
    
    service, property_id = result
    start_date, end_date = calculate_date_range(days)
    data = await service.get_top_pages(property_id, start_date, end_date, limit)
    
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    return data


@router.get("/data/dashboard")
async def get_dashboard_data(days: int = 30, current_user: dict = Depends(get_current_user)):
    """Get all dashboard data in one call."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await get_ga4_service()
    if not result:
        return {
            "configured": False,
            "message": "GA4 not configured. Please upload credentials in settings."
        }
    
    service, property_id = result
    start_date, end_date = calculate_date_range(days)
    
    try:
        page_views = await service.get_page_views(property_id, start_date, end_date)
        sessions = await service.get_sessions_and_users(property_id, start_date, end_date)
        bounce = await service.get_bounce_rate(property_id, start_date, end_date)
        sources = await service.get_traffic_sources(property_id, start_date, end_date)
        geo = await service.get_geographic_data(property_id, start_date, end_date)
        pages = await service.get_top_pages(property_id, start_date, end_date, 10)
        
        return {
            "configured": True,
            "period_days": days,
            "page_views": page_views,
            "sessions_users": sessions,
            "bounce_rate": bounce,
            "traffic_sources": sources,
            "geographic": geo,
            "top_pages": pages
        }
    except Exception as e:
        logger.error(f"Error fetching GA4 dashboard: {e}")
        return {
            "configured": True,
            "error": str(e),
            "message": "Error fetching data from Google Analytics"
        }
