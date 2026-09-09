"""
app/core/config.py — Application Settings

Single source of truth for all configuration.
Every other module imports from here — never reads os.environ directly.
"""

import os

# ---------------------------------------------------------------------------
# Secrets (read lazily via functions so they're resolved after load_dotenv())
# ---------------------------------------------------------------------------

def get_google_api_key() -> str:
    """Return the Google Gemini API key from the environment."""
    key = os.environ.get("GOOGLE_API_KEY", "")
    if not key:
        raise RuntimeError("GOOGLE_API_KEY is not set. Add it to your .env file.")
    return key


def get_mongo_uri() -> str:
    """Return the MongoDB Atlas connection string from the environment."""
    uri = os.environ.get("MONGO_URI", "")
    if not uri:
        raise RuntimeError("MONGO_URI is not set. Add it to your .env file.")
    return uri


# ---------------------------------------------------------------------------
# MongoDB settings — change these to match your Atlas setup
# ---------------------------------------------------------------------------
DB_NAME = "email_agent_db"
COLLECTION_NAME = "company_knowledge"
INDEX_NAME = "vector_index"   # Must match the Atlas Search index name you create


# ---------------------------------------------------------------------------
# File upload settings
# ---------------------------------------------------------------------------
UPLOAD_DIR_PATH = "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".txt"}
