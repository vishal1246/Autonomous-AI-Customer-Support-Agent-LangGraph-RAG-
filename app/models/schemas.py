"""
app/models/schemas.py — Pydantic Request & Response Models

All API data shapes live here.
FastAPI uses these to:
  - Validate incoming JSON (reject bad requests automatically)
  - Serialize outgoing responses (convert Python objects → JSON)
  - Generate the interactive /docs Swagger UI
"""

from typing import List
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Email Agent
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


class EmailResponse(BaseModel):
    """Response for POST /process-email and POST /resume-email"""
    email_id: str
    thread_id: str
    draft_response: str | None
    classification: dict | None
    requires_human_review: bool


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
# Knowledge Base Ingestion
# ---------------------------------------------------------------------------

class IngestURLsRequest(BaseModel):
    """Body for POST /ingest/urls"""
    urls: List[str]

    model_config = {
        "json_schema_extra": {
            "example": {
                "urls": [
                    "https://your-company.com/faq",
                    "https://your-company.com/docs/billing",
                ]
            }
        }
    }


class IngestResponse(BaseModel):
    """Response for both /ingest/urls and /ingest/files"""
    message: str
    chunks_stored: int
