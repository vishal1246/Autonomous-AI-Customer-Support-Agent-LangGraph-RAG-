"""
app/schemas/ingest.py — Knowledge Base Ingestion Pydantic Schemas

Covers:
  POST /ingest/urls    → IngestURLsRequest / IngestResponse
  POST /ingest/files   → IngestResponse
  GET  /ingest/history → IngestionRecord
"""

from typing import List
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Request models
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


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class IngestResponse(BaseModel):
    """Response for both /ingest/urls and /ingest/files"""
    message: str
    chunks_stored: int


# ---------------------------------------------------------------------------
# Ingestion History Log
# ---------------------------------------------------------------------------

class IngestionRecord(BaseModel):
    """A single ingestion event — returned by GET /ingest/history"""
    id: str
    source: str
    type: str          # "file" | "url"
    chunks_stored: int
    status: str        # "success" | "failed"
    timestamp: str
