"""
app/schemas/ — Pydantic Request & Response Models

Domain-specific schema modules:
  email.py  — EmailRequest, EmailResponse, ResumeRequest, ReviewItemSchema
  ingest.py — IngestURLsRequest, IngestResponse, IngestionRecord
"""

from backend.schemas.email import EmailRequest, EmailResponse, ResumeRequest, ReviewItemSchema
from backend.schemas.ingest import IngestURLsRequest, IngestResponse, IngestionRecord

__all__ = [
    "EmailRequest",
    "EmailResponse",
    "ResumeRequest",
    "ReviewItemSchema",
    "IngestURLsRequest",
    "IngestResponse",
    "IngestionRecord",
]
