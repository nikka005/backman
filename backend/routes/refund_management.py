"""
Refund Management System
Comprehensive refund handling with approval workflows
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, List
import logging
import uuid

from utils.auth import get_current_user
from models.user import UserRole
from utils.email import send_email

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/refunds", tags=["Refund Management"])

db = None

def init_router(database):
    global db
    db = database


# ============== Models ==============

class RefundRequest(BaseModel):
    payment_id: str
    amount: Optional[float] = None  # If None, full refund
    reason: str = Field(..., min_length=5)
    refund_type: str = "full"  # full, partial
    notify_customer: bool = True


class RefundApproval(BaseModel):
    approved: bool
    admin_notes: Optional[str] = None


class RefundStatus(BaseModel):
    id: str
    payment_id: str
    user_id: str
    amount: float
    original_amount: float
    reason: str
    status: str  # pending, approved, rejected, processed, failed
    refund_type: str
    requested_at: str
    requested_by: str
    processed_at: Optional[str] = None
    processed_by: Optional[str] = None
    admin_notes: Optional[str] = None
    stripe_refund_id: Optional[str] = None
    razorpay_refund_id: Optional[str] = None


# ============== Helper Functions ==============

async def send_refund_notification(user: dict, refund: dict, status: str):
    """Send refund status notification to customer."""
    try:
        if status == "approved":
            subject = "Your Refund Has Been Approved"
            body = f"""
            <h2>Refund Approved</h2>
            <p>Hi {user.get('name', 'there')},</p>
            <p>Your refund request has been approved!</p>
            <p><strong>Refund Amount:</strong> ${refund['amount']:.2f}</p>
            <p>The refund will be processed to your original payment method within 5-10 business days.</p>
            <br>
            <p>Best regards,<br>The Adverlyx Team</p>
            """
        elif status == "rejected":
            subject = "Update on Your Refund Request"
            body = f"""
            <h2>Refund Request Update</h2>
            <p>Hi {user.get('name', 'there')},</p>
            <p>We've reviewed your refund request and unfortunately, we're unable to process it at this time.</p>
            <p><strong>Reason:</strong> {refund.get('admin_notes', 'Does not meet refund policy criteria')}</p>
            <p>If you have questions, please contact our support team.</p>
            <br>
            <p>Best regards,<br>The Adverlyx Team</p>
            """
        elif status == "processed":
            subject = "Your Refund Has Been Processed"
            body = f"""
            <h2>Refund Processed</h2>
            <p>Hi {user.get('name', 'there')},</p>
            <p>Your refund of <strong>${refund['amount']:.2f}</strong> has been processed successfully.</p>
            <p>Please allow 5-10 business days for the amount to appear in your account.</p>
            <br>
            <p>Best regards,<br>The Adverlyx Team</p>
            """
        else:
            return
        
        await send_email(user["email"], subject, body)
    except Exception as e:
        logger.error(f"Failed to send refund notification: {e}")


# ============== API Endpoints ==============

@router.post("/request")
async def create_refund_request(
    request: RefundRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new refund request."""
    # Find the payment
    payment = await db.payments.find_one({"id": request.payment_id}, {"_id": 0})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check if refund already exists
    existing = await db.refunds.find_one({
        "payment_id": request.payment_id,
        "status": {"$in": ["pending", "approved", "processed"]}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="A refund request already exists for this payment")
    
    # Determine refund amount
    original_amount = payment.get("amount", 0)
    refund_amount = request.amount if request.amount else original_amount
    
    if refund_amount > original_amount:
        raise HTTPException(status_code=400, detail="Refund amount cannot exceed original payment")
    
    # Create refund record
    refund = {
        "id": f"refund_{uuid.uuid4().hex[:16]}",
        "payment_id": request.payment_id,
        "user_id": payment.get("user_id"),
        "user_email": payment.get("user_email"),
        "amount": refund_amount,
        "original_amount": original_amount,
        "currency": payment.get("currency", "usd"),
        "reason": request.reason,
        "refund_type": "full" if refund_amount == original_amount else "partial",
        "status": "pending",
        "payment_provider": payment.get("provider", "stripe"),
        "stripe_session_id": payment.get("stripe_session_id"),
        "razorpay_order_id": payment.get("razorpay_order_id"),
        "notify_customer": request.notify_customer,
        "requested_at": datetime.now(timezone.utc).isoformat(),
        "requested_by": current_user["user_id"]
    }
    
    await db.refunds.insert_one(refund)
    
    logger.info(f"Refund request created: {refund['id']} for payment {request.payment_id}")
    
    return {
        "message": "Refund request submitted",
        "refund_id": refund["id"],
        "status": "pending"
    }


@router.get("/")
async def get_refunds(
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get all refunds (admin) or user's refunds."""
    if current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        query = {}
    else:
        query = {"user_id": current_user["user_id"]}
    
    if status:
        query["status"] = status
    
    refunds = await db.refunds.find(query, {"_id": 0}).sort(
        "requested_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.refunds.count_documents(query)
    
    # Calculate stats
    pending = await db.refunds.count_documents({**query, "status": "pending"})
    approved = await db.refunds.count_documents({**query, "status": "approved"})
    processed = await db.refunds.count_documents({**query, "status": "processed"})
    rejected = await db.refunds.count_documents({**query, "status": "rejected"})
    
    # Calculate total refunded amount
    processed_refunds = await db.refunds.find(
        {**query, "status": "processed"},
        {"amount": 1, "_id": 0}
    ).to_list(1000)
    total_refunded = sum(r.get("amount", 0) for r in processed_refunds)
    
    return {
        "refunds": refunds,
        "total": total,
        "stats": {
            "pending": pending,
            "approved": approved,
            "processed": processed,
            "rejected": rejected,
            "total_refunded": total_refunded
        }
    }


@router.get("/{refund_id}")
async def get_refund(
    refund_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific refund."""
    refund = await db.refunds.find_one({"id": refund_id}, {"_id": 0})
    
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    # Check access
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if not is_admin and refund["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return refund


@router.post("/{refund_id}/approve")
async def approve_refund(
    refund_id: str,
    approval: RefundApproval,
    current_user: dict = Depends(get_current_user)
):
    """Approve or reject a refund (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    refund = await db.refunds.find_one({"id": refund_id}, {"_id": 0})
    
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    if refund["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Refund is already {refund['status']}")
    
    new_status = "approved" if approval.approved else "rejected"
    
    await db.refunds.update_one(
        {"id": refund_id},
        {"$set": {
            "status": new_status,
            "admin_notes": approval.admin_notes,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_by": current_user["user_id"]
        }}
    )
    
    # Send notification if enabled
    if refund.get("notify_customer"):
        user = await db.users.find_one({"id": refund["user_id"]}, {"_id": 0})
        if user:
            refund["admin_notes"] = approval.admin_notes
            await send_refund_notification(user, refund, new_status)
    
    return {
        "message": f"Refund {new_status}",
        "refund_id": refund_id,
        "status": new_status
    }


@router.post("/{refund_id}/process")
async def process_refund(
    refund_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Process an approved refund (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    refund = await db.refunds.find_one({"id": refund_id}, {"_id": 0})
    
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    if refund["status"] != "approved":
        raise HTTPException(status_code=400, detail="Only approved refunds can be processed")
    
    # In production, this would call Stripe/Razorpay API
    # For now, simulate successful processing
    
    try:
        # Simulate payment provider refund
        provider = refund.get("payment_provider", "stripe")
        
        if provider == "stripe":
            # In production: stripe.Refund.create(payment_intent=...)
            provider_refund_id = f"re_{uuid.uuid4().hex[:20]}"
        else:
            # In production: razorpay.payment.refund(...)
            provider_refund_id = f"rfnd_{uuid.uuid4().hex[:16]}"
        
        # Update refund record
        await db.refunds.update_one(
            {"id": refund_id},
            {"$set": {
                "status": "processed",
                f"{provider}_refund_id": provider_refund_id,
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "processed_by": current_user["user_id"]
            }}
        )
        
        # Update original payment status
        await db.payments.update_one(
            {"id": refund["payment_id"]},
            {"$set": {
                "refund_status": "refunded" if refund["refund_type"] == "full" else "partial_refunded",
                "refund_amount": refund["amount"],
                "refund_id": refund_id,
                "refunded_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Cancel subscription if full refund
        if refund["refund_type"] == "full":
            await db.subscriptions.update_one(
                {"user_id": refund["user_id"], "status": "active"},
                {"$set": {
                    "status": "cancelled",
                    "cancel_reason": "refunded",
                    "cancelled_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        
        # Send notification
        if refund.get("notify_customer"):
            user = await db.users.find_one({"id": refund["user_id"]}, {"_id": 0})
            if user:
                await send_refund_notification(user, refund, "processed")
        
        logger.info(f"Refund {refund_id} processed successfully")
        
        return {
            "message": "Refund processed successfully",
            "refund_id": refund_id,
            "provider_refund_id": provider_refund_id
        }
        
    except Exception as e:
        logger.error(f"Failed to process refund {refund_id}: {e}")
        
        await db.refunds.update_one(
            {"id": refund_id},
            {"$set": {
                "status": "failed",
                "error_message": str(e),
                "failed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        raise HTTPException(status_code=500, detail=f"Failed to process refund: {str(e)}")


@router.get("/stats/summary")
async def get_refund_stats(current_user: dict = Depends(get_current_user)):
    """Get refund statistics (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    
    # Overall stats
    total_refunds = await db.refunds.count_documents({})
    pending_refunds = await db.refunds.count_documents({"status": "pending"})
    
    # This month
    this_month_refunds = await db.refunds.find({
        "requested_at": {"$gte": thirty_days_ago.isoformat()}
    }, {"amount": 1, "status": 1, "_id": 0}).to_list(1000)
    
    this_month_count = len(this_month_refunds)
    this_month_amount = sum(
        r.get("amount", 0) for r in this_month_refunds if r.get("status") == "processed"
    )
    
    # All time processed
    all_processed = await db.refunds.find(
        {"status": "processed"},
        {"amount": 1, "_id": 0}
    ).to_list(10000)
    total_refunded = sum(r.get("amount", 0) for r in all_processed)
    
    # Average refund amount
    avg_refund = total_refunded / len(all_processed) if all_processed else 0
    
    # Refund rate (refunds / total payments)
    total_payments = await db.payments.count_documents({})
    refund_rate = (len(all_processed) / total_payments * 100) if total_payments > 0 else 0
    
    return {
        "total_refunds": total_refunds,
        "pending_refunds": pending_refunds,
        "this_month": {
            "count": this_month_count,
            "amount": this_month_amount
        },
        "all_time": {
            "processed_count": len(all_processed),
            "total_amount": total_refunded,
            "average_amount": avg_refund
        },
        "refund_rate": round(refund_rate, 2)
    }


# Import timedelta for stats
from datetime import timedelta
