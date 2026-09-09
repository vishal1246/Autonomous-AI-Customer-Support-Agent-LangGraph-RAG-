"""
app/api/routes/ingest.py — Knowledge Base Ingestion Endpoints

POST /ingest/urls   — load company web pages into the knowledge base
POST /ingest/files  — upload local PDF/TXT files into the knowledge base

Rule: this file contains ONLY HTTP routing. All ingestion logic is in app/knowledge/ingest.py.
"""

import shutil
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import ALLOWED_EXTENSIONS, UPLOAD_DIR_PATH
from app.knowledge.ingest import ingest_files, ingest_urls
from app.models.schemas import IngestResponse, IngestURLsRequest

router = APIRouter(tags=["Knowledge Base"])

# Ensure the uploads directory exists on startup
UPLOAD_DIR = Path(UPLOAD_DIR_PATH)
UPLOAD_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# POST /ingest/urls
# ---------------------------------------------------------------------------

@router.post("/ingest/urls", response_model=IngestResponse)
async def ingest_company_urls(request: IngestURLsRequest):
    """
    Fetch one or more web pages and store their content in the knowledge base.

    Use this to ingest your company FAQ pages, product docs, or any public URLs.
    """
    if not request.urls:
        raise HTTPException(status_code=400, detail="At least one URL is required.")

    try:
        chunks = ingest_urls(request.urls)
        return IngestResponse(
            message=f"Successfully ingested {len(request.urls)} URL(s).",
            chunks_stored=chunks,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# POST /ingest/files
# ---------------------------------------------------------------------------

@router.post("/ingest/files", response_model=IngestResponse)
async def ingest_company_files(files: List[UploadFile] = File(...)):
    """
    Upload one or more local files and store their content in the knowledge base.

    Supported formats: `.pdf`, `.txt`
    """
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required.")

    saved_paths: List[str] = []
    try:
        for upload in files:
            suffix = Path(upload.filename or "").suffix.lower()
            if suffix not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Unsupported file type '{suffix}' in '{upload.filename}'. "
                        f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
                    ),
                )
            # Save to disk with a UUID filename to avoid collisions
            dest = UPLOAD_DIR / f"{uuid.uuid4()}{suffix}"
            with dest.open("wb") as f:
                shutil.copyfileobj(upload.file, f)
            saved_paths.append(str(dest))

        chunks = ingest_files(saved_paths)
        return IngestResponse(
            message=f"Successfully ingested {len(files)} file(s).",
            chunks_stored=chunks,
        )

    except HTTPException:
        raise  # re-raise validation errors as-is
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
