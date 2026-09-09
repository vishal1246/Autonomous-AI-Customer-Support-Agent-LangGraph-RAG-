"""
app/main.py — FastAPI Application Entry Point

This file ONLY does three things:
  1. Load .env (must be first — before any imports that read env vars)
  2. Create the FastAPI app and add middleware
  3. Mount the API router and add health/root endpoints

All business logic lives elsewhere:
  app/agent/   — the AI email agent
  app/knowledge/ — document ingestion and retrieval
  app/api/     — HTTP route handlers
  app/models/  — request/response schemas
  app/core/    — configuration
"""

from dotenv import load_dotenv

# ── Must be first: loads GOOGLE_API_KEY and MONGO_URI into os.environ ──────
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Customer Support Email Agent",
    description=(
        "AI-powered email agent that classifies incoming customer emails, "
        "queries your company knowledge base, and drafts professional replies."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this to your domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# General routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["General"])
async def root():
    return {
        "service": "Customer Support Email Agent",
        "interactive_docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["General"])
async def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Mount all API routes (email + ingest)
# ---------------------------------------------------------------------------

app.include_router(api_router)


# ---------------------------------------------------------------------------
# Swagger UI OpenAPI Schema Patch for File Uploads
# ---------------------------------------------------------------------------
# Newer FastAPI versions generate OpenAPI 3.1 with contentMediaType, which causes
# Swagger UI to show text inputs instead of file pickers. This restores format: "binary".

from fastapi.openapi.utils import get_openapi


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )

    for schema in openapi_schema.get("components", {}).get("schemas", {}).values():
        for prop in schema.get("properties", {}).values():
            if prop.get("contentMediaType") == "application/octet-stream":
                prop.pop("contentMediaType", None)
                prop["format"] = "binary"
            if isinstance(prop.get("items"), dict) and prop["items"].get("contentMediaType") == "application/octet-stream":
                prop["items"].pop("contentMediaType", None)
                prop["items"]["format"] = "binary"

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
