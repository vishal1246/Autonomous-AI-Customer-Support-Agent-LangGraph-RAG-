"""
app/schemas/email.py — Email Agent Pydantic Schemas

Covers:
  POST /process-email  → EmailRequest / EmailResponse
  POST /resume-email   → ResumeRequest
  GET  /review-queue   → ReviewItemSchema
"""

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class EmailRequest(BaseModel):
    """Body for POST /process-email"""
    email_content: str
    sender_email: str
    email_id: str = ""   # optional — auto-generated if blank

    model_config = {
        "json_schema_extra": {
            "example": {
                "email_content": "Hi, I can't reset my password. The reset link isn't working.",
                "sender_email": "customer@example.com",
                "email_id": "EMAIL-001",
            }
        }
    }


class ResumeRequest(BaseModel):
    """Body for POST /resume-email — resumes a paused human-review workflow"""
    thread_id: str
    approved: bool
    edited_response: str = ""   # optional edited text; original draft used if blank

    model_config = {
        "json_schema_extra": {
            "example": {
                "thread_id": "uuid-from-process-email-response",
                "approved": True,
                "edited_response": "Thank you for reaching out. Here is our updated response...",
            }
        }
    }


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class EmailResponse(BaseModel):
    """Response for POST /process-email and POST /resume-email"""
    email_id: str
    thread_id: str
    draft_response: str | None
    classification: dict | None
    requires_human_review: bool


# ---------------------------------------------------------------------------
# Human Review Queue
# ---------------------------------------------------------------------------

class ReviewItemSchema(BaseModel):
    """A single email pending human review — returned by GET /review-queue"""
    email_id: str
    thread_id: str
    sender_email: str
    email_content: str
    draft_response: str
    classification: dict
    timestamp: str
    jira_ticket: str | None = None
