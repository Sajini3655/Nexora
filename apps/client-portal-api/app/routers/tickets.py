from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from app.services.groq_service import summarize_ticket_with_groq
from app.storage.ticket_store import save_ticket

router = APIRouter(tags=["tickets"])

class TicketForm(BaseModel):
    category: str
    name: str
    company: str
    email: str
    project: str
    urgency: str = Field(default="Medium")
    description: str
    steps: Optional[str] = ""
    expected: Optional[str] = ""
    actual: Optional[str] = ""

class SummarizeResponse(BaseModel):
    title: str
    summary: str
    internal_category: str
    priority: str
    raw: Dict[str, Any]

@router.post("/tickets/summarize", response_model=SummarizeResponse)
def summarize(form: TicketForm):
    try:
        result = summarize_ticket_with_groq(form.model_dump())
        return {
            "title": result.get("title", "Client Ticket"),
            "summary": result.get("summary", ""),
            "internal_category": result.get("internal_category", "info"),
            "priority": result.get("priority", "Medium"),
            "raw": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CreateTicketRequest(BaseModel):
    form: TicketForm
    ai: Dict[str, Any]

@router.post("/tickets/create")
def create_ticket(payload: CreateTicketRequest):
    try:
        ticket = save_ticket(payload.form.model_dump(), payload.ai)
        return {"ok": True, "ticket": ticket}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
