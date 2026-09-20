"""Quick script to verify website data is stored correctly and retrieval works."""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

from pymongo import MongoClient

MONGO_URI = os.environ.get("MONGO_URI", "")
DB_NAME = "email_agent_db"
COLLECTION_NAME = "company_knowledge"

if not MONGO_URI:
    print("ERROR: MONGO_URI not set in .env")
    sys.exit(1)

client = MongoClient(MONGO_URI)
collection = client[DB_NAME][COLLECTION_NAME]

# --- 1. Count documents ---
count = collection.count_documents({})
print(f"\n[1] Total chunks in database: {count}")
if count == 0:
    print("    WARNING: No documents found. Ingestion may have failed.")
    sys.exit(1)

# --- 2. Show sample chunks with source URL ---
print("\n[2] Sample chunks (first 3):")
for doc in collection.find({}, {"text": 1, "metadata": 1, "embedding": 1}).limit(3):
    source = doc.get("metadata", {}).get("source", "unknown")
    text = doc.get("text", "")[:200]
    embedding = doc.get("embedding", [])
    print(f"    Source : {source}")
    print(f"    Preview: {text!r}")
    print(f"    Embedding dims: {len(embedding)}")
    print()

# --- 3. Check embedding dimensions match index ---
sample = collection.find_one({"embedding": {"$exists": True}})
if sample:
    dims = len(sample.get("embedding", []))
    print(f"[3] Embedding dimensions stored: {dims}")
    if dims != 768:
        print(f"    WARNING: Index expects 768 but stored embeddings have {dims} dims — mismatch!")
    else:
        print("    OK: Matches index numDimensions=768")

# --- 4. Test similarity search ---
print("\n[4] Testing vector similarity search...")
try:
    from app.knowledge.retriever import retrieve_information
    test_query = "what Ingredients you use in Delhi biryani"
    result = retrieve_information.invoke(test_query)
    print(f"    Query: {test_query!r}")
    print(f"    Result preview:\n{result[:500]}")
except Exception as e:
    print(f"    ERROR during retrieval: {e}")

print("\nDone.")
