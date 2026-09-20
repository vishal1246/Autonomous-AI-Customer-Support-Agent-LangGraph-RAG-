"""
tests/test_ingest_routes.py — Tests for /ingest/urls, /ingest/files, /ingest/history
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# TODO: Add ingest URL, file, and history tests
# Use pytest-mock to mock ingest_urls(), ingest_files(), and MongoDB calls
