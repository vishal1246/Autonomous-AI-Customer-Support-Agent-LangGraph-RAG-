"""
app/api/router.py — API Router Registry

Combines all route groups into a single APIRouter.
app/main.py mounts this with app.include_router(api_router).

To add a new group of routes:
  1. Create app/api/routes/your_feature.py with a router = APIRouter()
  2. Import and include it here
"""

from fastapi import APIRouter

from app.api.routes.email import router as email_router
from app.api.routes.ingest import router as ingest_router

api_router = APIRouter()
api_router.include_router(email_router)
api_router.include_router(ingest_router)
