"""
PDF Invoice Generation System
Generate professional invoices for payments
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
import logging
import io
import uuid

from utils.auth import get_current_user
from models.user import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/invoices", tags=["Invoices"])

db = None

def init_router(database):
    global db
    db = database


# ============== Invoice Generation ==============

def generate_invoice_html(invoice_data: dict) -> str:
    """Generate HTML invoice content."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice {invoice_data['invoice_number']}</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #fff; padding: 40px; }}
            .invoice {{ max-width: 800px; margin: 0 auto; }}
            .header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #ec4899; }}
            .logo {{ font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
            .invoice-title {{ text-align: right; }}
            .invoice-title h1 {{ font-size: 36px; color: #1f2937; margin-bottom: 8px; }}
            .invoice-title .number {{ color: #6b7280; font-size: 14px; }}
            .status {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }}
            .status.paid {{ background: #d1fae5; color: #065f46; }}
            .status.pending {{ background: #fef3c7; color: #92400e; }}
            .details {{ display: flex; justify-content: space-between; margin-bottom: 40px; }}
            .details-section {{ flex: 1; }}
            .details-section h3 {{ font-size: 12px; text-transform: uppercase; color: #9ca3af; margin-bottom: 12px; letter-spacing: 1px; }}
            .details-section p {{ margin-bottom: 4px; }}
            .details-section .name {{ font-weight: 600; font-size: 16px; }}
            .table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
            .table th {{ background: #f9fafb; padding: 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }}
            .table td {{ padding: 16px; border-bottom: 1px solid #e5e7eb; }}
            .table .amount {{ text-align: right; }}
            .totals {{ text-align: right; margin-bottom: 40px; }}
            .totals .row {{ display: flex; justify-content: flex-end; margin-bottom: 8px; }}
            .totals .label {{ color: #6b7280; margin-right: 40px; min-width: 120px; }}
            .totals .value {{ font-weight: 600; min-width: 100px; text-align: right; }}
            .totals .grand-total {{ font-size: 24px; color: #1f2937; padding-top: 12px; border-top: 2px solid #e5e7eb; margin-top: 8px; }}
            .footer {{ text-align: center; color: #9ca3af; font-size: 12px; padding-top: 40px; border-top: 1px solid #e5e7eb; }}
            .footer p {{ margin-bottom: 4px; }}
            .notes {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }}
            .notes h3 {{ font-size: 14px; margin-bottom: 8px; color: #374151; }}
            .notes p {{ color: #6b7280; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="invoice">
            <div class="header">
                <div class="logo">Adverlyx</div>
                <div class="invoice-title">
                    <h1>INVOICE</h1>
                    <p class="number">{invoice_data['invoice_number']}</p>
                    <span class="status {invoice_data['status'].lower()}">{invoice_data['status'].upper()}</span>
                </div>
            </div>
            
            <div class="details">
                <div class="details-section">
                    <h3>From</h3>
                    <p class="name">Adverlyx Digital</p>
                    <p>contact@adverlyx.com</p>
                    <p>www.adverlyx.com</p>
                </div>
                <div class="details-section">
                    <h3>Bill To</h3>
                    <p class="name">{invoice_data['customer_name']}</p>
                    <p>{invoice_data['customer_email']}</p>
                </div>
                <div class="details-section">
                    <h3>Invoice Details</h3>
                    <p><strong>Date:</strong> {invoice_data['date']}</p>
                    <p><strong>Due Date:</strong> {invoice_data['due_date']}</p>
                    <p><strong>Payment Method:</strong> {invoice_data['payment_method']}</p>
                </div>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Period</th>
                        <th class="amount">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>{invoice_data['plan_name']} Plan</strong><br>
                            <span style="color: #6b7280; font-size: 14px;">Instagram Growth Service - {invoice_data['billing_cycle'].title()}</span>
                        </td>
                        <td>{invoice_data['period']}</td>
                        <td class="amount">${invoice_data['subtotal']:.2f}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="totals">
                <div class="row">
                    <span class="label">Subtotal</span>
                    <span class="value">${invoice_data['subtotal']:.2f}</span>
                </div>
                {f'<div class="row"><span class="label">Discount ({invoice_data["discount_percent"]}%)</span><span class="value">-${invoice_data["discount_amount"]:.2f}</span></div>' if invoice_data.get('discount_percent', 0) > 0 else ''}
                <div class="row">
                    <span class="label">Tax</span>
                    <span class="value">${invoice_data.get('tax', 0):.2f}</span>
                </div>
                <div class="row grand-total">
                    <span class="label">Total</span>
                    <span class="value">${invoice_data['total']:.2f} {invoice_data['currency'].upper()}</span>
                </div>
            </div>
            
            <div class="notes">
                <h3>Payment Information</h3>
                <p>Thank you for your business! This invoice was paid via {invoice_data['payment_method']}.</p>
            </div>
            
            <div class="footer">
                <p>Adverlyx Digital - Instagram Growth Platform</p>
                <p>Invoice generated on {invoice_data['generated_at']}</p>
                <p>Questions? Contact support@adverlyx.com</p>
            </div>
        </div>
    </body>
    </html>
    """


async def generate_invoice_pdf(invoice_data: dict) -> bytes:
    """Generate PDF from invoice data using WeasyPrint or similar."""
    try:
        # Try to use WeasyPrint for PDF generation
        from weasyprint import HTML
        html_content = generate_invoice_html(invoice_data)
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except ImportError:
        # Fallback: Return HTML if WeasyPrint not available
        logger.warning("WeasyPrint not available, returning HTML invoice")
        return generate_invoice_html(invoice_data).encode('utf-8')


# ============== API Endpoints ==============

@router.get("/payment/{payment_id}")
async def get_invoice_for_payment(
    payment_id: str,
    format: str = "html",
    current_user: dict = Depends(get_current_user)
):
    """Get invoice for a specific payment."""
    # Find payment
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Check access
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if not is_admin and payment["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get user info
    user = await db.users.find_one({"id": payment["user_id"]}, {"_id": 0})
    
    # Build invoice data
    payment_date = datetime.fromisoformat(payment["created_at"].replace('Z', '+00:00'))
    
    invoice_data = {
        "invoice_number": f"INV-{payment_date.strftime('%Y%m')}-{payment_id[-8:].upper()}",
        "customer_name": user.get("name", "Customer"),
        "customer_email": user.get("email", payment.get("user_email", "")),
        "date": payment_date.strftime("%B %d, %Y"),
        "due_date": payment_date.strftime("%B %d, %Y"),
        "status": "Paid" if payment.get("status") in ["success", "paid"] else payment.get("status", "Pending").title(),
        "plan_name": payment.get("plan", "Pro").title(),
        "billing_cycle": payment.get("billing", "monthly"),
        "period": f"{payment_date.strftime('%b %Y')} - {(payment_date.replace(month=payment_date.month % 12 + 1) if payment_date.month < 12 else payment_date.replace(year=payment_date.year + 1, month=1)).strftime('%b %Y')}",
        "subtotal": payment.get("amount", 0),
        "discount_percent": payment.get("discount_percent", 0),
        "discount_amount": payment.get("discount_amount", 0),
        "tax": 0,
        "total": payment.get("amount", 0),
        "currency": payment.get("currency", "usd"),
        "payment_method": payment.get("provider", "Card").title(),
        "generated_at": datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    }
    
    if format == "pdf":
        pdf_content = await generate_invoice_pdf(invoice_data)
        
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice-{invoice_data['invoice_number']}.pdf"
            }
        )
    else:
        html_content = generate_invoice_html(invoice_data)
        return Response(content=html_content, media_type="text/html")


@router.get("/subscription/{subscription_id}")
async def get_invoice_for_subscription(
    subscription_id: str,
    format: str = "html",
    current_user: dict = Depends(get_current_user)
):
    """Get invoice for a subscription."""
    subscription = await db.subscriptions.find_one({"id": subscription_id}, {"_id": 0})
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    is_admin = current_user.get("role") in [UserRole.ADMIN.value, "ADMIN", "admin"]
    if not is_admin and subscription["user_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"id": subscription["user_id"]}, {"_id": 0})
    
    start_date = datetime.fromisoformat(subscription.get("started_at", subscription.get("created_at", datetime.now(timezone.utc).isoformat())).replace('Z', '+00:00'))
    
    invoice_data = {
        "invoice_number": f"INV-SUB-{start_date.strftime('%Y%m')}-{subscription_id[-8:].upper()}",
        "customer_name": user.get("name", "Customer"),
        "customer_email": user.get("email", ""),
        "date": start_date.strftime("%B %d, %Y"),
        "due_date": start_date.strftime("%B %d, %Y"),
        "status": "Paid" if subscription.get("status") == "active" else subscription.get("status", "Pending").title(),
        "plan_name": subscription.get("plan", "Pro").title(),
        "billing_cycle": subscription.get("billing_cycle", "monthly"),
        "period": f"{start_date.strftime('%b %d, %Y')} - {subscription.get('next_billing_date', '')[:10] if subscription.get('next_billing_date') else 'Ongoing'}",
        "subtotal": subscription.get("amount", subscription.get("price", 0)),
        "discount_percent": subscription.get("discount_percent", 0),
        "discount_amount": 0,
        "tax": 0,
        "total": subscription.get("amount", subscription.get("price", 0)),
        "currency": subscription.get("currency", "usd"),
        "payment_method": subscription.get("payment_method", "Card").title() if subscription.get("payment_method") else "Card",
        "generated_at": datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    }
    
    if format == "pdf":
        pdf_content = await generate_invoice_pdf(invoice_data)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice-{invoice_data['invoice_number']}.pdf"
            }
        )
    else:
        return Response(content=generate_invoice_html(invoice_data), media_type="text/html")


@router.get("/my-invoices")
async def get_my_invoices(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """Get all invoices for current user."""
    payments = await db.payments.find(
        {"user_id": current_user["user_id"], "status": {"$in": ["success", "paid"]}},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    invoices = []
    for payment in payments:
        payment_date = datetime.fromisoformat(payment["created_at"].replace('Z', '+00:00'))
        invoices.append({
            "id": payment["id"],
            "invoice_number": f"INV-{payment_date.strftime('%Y%m')}-{payment['id'][-8:].upper()}",
            "date": payment_date.isoformat(),
            "amount": payment.get("amount", 0),
            "currency": payment.get("currency", "usd"),
            "plan": payment.get("plan", "Pro"),
            "status": "Paid"
        })
    
    return {"invoices": invoices}


@router.get("/admin/all")
async def get_all_invoices(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get all invoices (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    payments = await db.payments.find(
        {"status": {"$in": ["success", "paid"]}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    invoices = []
    for payment in payments:
        user = await db.users.find_one({"id": payment["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        payment_date = datetime.fromisoformat(payment["created_at"].replace('Z', '+00:00'))
        invoices.append({
            "id": payment["id"],
            "invoice_number": f"INV-{payment_date.strftime('%Y%m')}-{payment['id'][-8:].upper()}",
            "date": payment_date.isoformat(),
            "amount": payment.get("amount", 0),
            "currency": payment.get("currency", "usd"),
            "plan": payment.get("plan", "Pro"),
            "customer_name": user.get("name") if user else "Unknown",
            "customer_email": user.get("email") if user else payment.get("user_email", ""),
            "status": "Paid"
        })
    
    total = await db.payments.count_documents({"status": {"$in": ["success", "paid"]}})
    
    return {"invoices": invoices, "total": total}


@router.post("/generate/{payment_id}")
async def generate_and_store_invoice(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate and store an invoice (admin only)."""
    if current_user.get("role") not in [UserRole.ADMIN.value, "ADMIN", "admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    user = await db.users.find_one({"id": payment["user_id"]}, {"_id": 0})
    payment_date = datetime.fromisoformat(payment["created_at"].replace('Z', '+00:00'))
    
    invoice_record = {
        "id": f"inv_{uuid.uuid4().hex[:16]}",
        "payment_id": payment_id,
        "user_id": payment["user_id"],
        "invoice_number": f"INV-{payment_date.strftime('%Y%m')}-{payment_id[-8:].upper()}",
        "customer_name": user.get("name", "Customer") if user else "Customer",
        "customer_email": user.get("email", "") if user else payment.get("user_email", ""),
        "amount": payment.get("amount", 0),
        "currency": payment.get("currency", "usd"),
        "status": "issued",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": current_user["user_id"]
    }
    
    await db.invoices.insert_one(invoice_record)
    
    return {
        "message": "Invoice generated",
        "invoice_id": invoice_record["id"],
        "invoice_number": invoice_record["invoice_number"]
    }
