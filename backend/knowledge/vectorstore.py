"""
app/knowledge/vectorstore.py — MongoDB Atlas Vector Store Factory

Responsible for:
  - Connecting to MongoDB Atlas
  - Setting up Google Gemini Embeddings
  - Returning a MongoDBAtlasVectorSearch instance

Every other file in knowledge/ imports from here.
To swap to a different vector DB (e.g. Pinecone), change only this file.
"""

from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient

from backend.core.config import (
    get_google_api_key,
    get_mongo_uri,
    DB_NAME,
    COLLECTION_NAME,
    INDEX_NAME,
)


def get_vectorstore() -> MongoDBAtlasVectorSearch:
    """
    Create and return a MongoDBAtlasVectorSearch instance.

    Called on every ingest or search operation.
    In production, replace MongoClient with a connection pool.
    """
    client = MongoClient(get_mongo_uri())
    collection = client[DB_NAME][COLLECTION_NAME]

    embeddings = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-001",
        google_api_key=get_google_api_key(),
        output_dimensionality=768
    )

    return MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name=INDEX_NAME,
        relevance_score_fn="cosine",
    )
