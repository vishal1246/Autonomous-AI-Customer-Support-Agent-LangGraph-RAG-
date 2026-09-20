"""
app/db/mongo.py — Shared MongoDB Client

Single connection-pooled MongoClient for the entire application.
All modules import collection helpers from here instead of creating
their own MongoClient instances.

Usage:
    from backend.db.mongo import review_queue_col, ingest_log_col
"""

from pymongo import MongoClient, DESCENDING
from pymongo.collection import Collection

from backend.core.config import (
    get_mongo_uri,
    DB_NAME,
    REVIEW_QUEUE_COLLECTION,
    INGEST_LOG_COLLECTION,
)

# ---------------------------------------------------------------------------
# Singleton client — created once at import time, connection-pooled by pymongo
# ---------------------------------------------------------------------------

_client: MongoClient | None = None


def _get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(get_mongo_uri())
    return _client


def get_db():
    """Return the application database handle."""
    return _get_client()[DB_NAME]


# ---------------------------------------------------------------------------
# Collection helpers
# ---------------------------------------------------------------------------

def review_queue_col() -> Collection:
    """Return the review_queue collection (unique index on thread_id)."""
    col = get_db()[REVIEW_QUEUE_COLLECTION]
    col.create_index("thread_id", unique=True, background=True)
    return col


def ingest_log_col() -> Collection:
    """Return the ingest_log collection (descending index on timestamp)."""
    col = get_db()[INGEST_LOG_COLLECTION]
    col.create_index([("timestamp", DESCENDING)], background=True)
    return col
