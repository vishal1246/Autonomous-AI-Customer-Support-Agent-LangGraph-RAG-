"""
tests/test_email_routes.py — Tests for /process-email, /resume-email, /review-queue
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data


# TODO: Add process-email, resume-email, and review-queue tests
# Use pytest-mock to mock email_agent_graph.stream() and MongoDB calls
