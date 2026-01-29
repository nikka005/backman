from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel

from models.ticket import (
    Ticket, TicketCreate, TicketUpdate, TicketReply,
    TicketStatus, TicketPriority, TicketMessage
)
from utils.auth import get_current_user

router = APIRouter(prefix="/tickets", tags=["Support Tickets"])

db = None

def init_router(database):
    global db
    db = database


class TicketListResponse(BaseModel):
    id: str
    subject: str
    category: str
    status: TicketStatus
    priority: TicketPriority
    created_at: datetime
    updated_at: datetime
    message_count: int


@router.post("/", response_model=Ticket)
async def create_ticket(ticket_data: TicketCreate, current_user: dict = Depends(get_current_user)):
    """Create a new support ticket."""
    # Create initial message
    initial_message = TicketMessage(
        sender_id=current_user['user_id'],
        sender_role=current_user['role'],
        message=ticket_data.message
    )
    
    ticket = Ticket(
        user_id=current_user['user_id'],
        subject=ticket_data.subject,
        category=ticket_data.category,
        priority=ticket_data.priority,
        messages=[initial_message]
    )
    
    # Save to database
    ticket_dict = ticket.model_dump()
    ticket_dict['created_at'] = ticket_dict['created_at'].isoformat()
    ticket_dict['updated_at'] = ticket_dict['updated_at'].isoformat()
    for msg in ticket_dict['messages']:
        msg['created_at'] = msg['created_at'].isoformat()
    
    await db.tickets.insert_one(ticket_dict)
    
    return ticket


@router.get("/", response_model=List[TicketListResponse])
async def get_tickets(
    status_filter: Optional[TicketStatus] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's support tickets."""
    query = {"user_id": current_user['user_id']}
    if status_filter:
        query["status"] = status_filter
    
    tickets = await db.tickets.find(query, {"_id": 0}).sort("updated_at", -1).to_list(100)
    
    return [
        TicketListResponse(
            id=t['id'],
            subject=t['subject'],
            category=t['category'],
            status=t['status'],
            priority=t['priority'],
            created_at=datetime.fromisoformat(t['created_at']) if isinstance(t['created_at'], str) else t['created_at'],
            updated_at=datetime.fromisoformat(t['updated_at']) if isinstance(t['updated_at'], str) else t['updated_at'],
            message_count=len(t.get('messages', []))
        )
        for t in tickets
    ]


@router.get("/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific ticket."""
    ticket_doc = await db.tickets.find_one(
        {"id": ticket_id, "user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not ticket_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    return Ticket(**ticket_doc)


@router.post("/{ticket_id}/reply", response_model=Ticket)
async def reply_to_ticket(ticket_id: str, reply: TicketReply, current_user: dict = Depends(get_current_user)):
    """Reply to a ticket."""
    ticket_doc = await db.tickets.find_one(
        {"id": ticket_id, "user_id": current_user['user_id']}
    )
    
    if not ticket_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    if ticket_doc['status'] == TicketStatus.CLOSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reply to a closed ticket"
        )
    
    # Create message
    message = TicketMessage(
        sender_id=current_user['user_id'],
        sender_role=current_user['role'],
        message=reply.message
    )
    
    message_dict = message.model_dump()
    message_dict['created_at'] = message_dict['created_at'].isoformat()
    
    # Update ticket
    await db.tickets.update_one(
        {"id": ticket_id},
        {
            "$push": {"messages": message_dict},
            "$set": {
                "status": TicketStatus.WAITING_USER if current_user['role'] in ['admin', 'support'] else TicketStatus.OPEN,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    updated_doc = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    return Ticket(**updated_doc)


@router.post("/{ticket_id}/close")
async def close_ticket(ticket_id: str, current_user: dict = Depends(get_current_user)):
    """Close a ticket."""
    ticket_doc = await db.tickets.find_one(
        {"id": ticket_id, "user_id": current_user['user_id']}
    )
    
    if not ticket_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )
    
    await db.tickets.update_one(
        {"id": ticket_id},
        {"$set": {
            "status": TicketStatus.CLOSED,
            "closed_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Ticket closed successfully"}
