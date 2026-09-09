"""
app/knowledge/ingest.py — Document Ingestion

Handles loading company documents (local files + web URLs),
splitting them into chunks, and storing them in MongoDB Atlas.

Called by: app/api/routes/ingest.py
"""

import os
from typing import List

import bs4
import requests
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.knowledge.vectorstore import get_vectorstore

# Split large documents into 1000-char chunks with 200-char overlap
# so context isn't lost at chunk boundaries
_TEXT_SPLITTER = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)


# ---------------------------------------------------------------------------
# Private loaders
# ---------------------------------------------------------------------------

def _load_url(url: str) -> List[Document]:
    """Fetch a web page, strip HTML tags, return as a Document."""
    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        soup = bs4.BeautifulSoup(response.text, "html.parser")
        text = soup.get_text(separator="\n", strip=True)
        return [Document(page_content=text, metadata={"source": url})]
    except Exception as e:
        print(f"[ingest] Could not load URL {url}: {e}")
        return []


def _load_file(file_path: str) -> List[Document]:
    """Load a local PDF or TXT file and return as Documents."""
    if not os.path.exists(file_path):
        print(f"[ingest] File not found: {file_path}")
        return []
    if file_path.lower().endswith(".pdf"):
        return PyPDFLoader(file_path).load()
    return TextLoader(file_path, encoding="utf-8").load()


# ---------------------------------------------------------------------------
# Public API — called from ingest routes
# ---------------------------------------------------------------------------

def ingest_urls(urls: List[str]) -> int:
    """
    Fetch web pages and store their content in MongoDB.

    Args:
        urls: List of public web page URLs.

    Returns:
        Number of text chunks stored.
    """
    docs: List[Document] = []
    for url in urls:
        docs.extend(_load_url(url))

    if not docs:
        print("[ingest] No content loaded from the provided URLs.")
        return 0

    splits = _TEXT_SPLITTER.split_documents(docs)
    get_vectorstore().add_documents(splits)
    print(f"[ingest] Stored {len(splits)} chunks from {len(urls)} URL(s).")
    return len(splits)


def ingest_files(file_paths: List[str]) -> int:
    """
    Load local files and store their content in MongoDB.

    Args:
        file_paths: Absolute paths to PDF or TXT files on disk.

    Returns:
        Number of text chunks stored.
    """
    docs: List[Document] = []
    for path in file_paths:
        docs.extend(_load_file(path))

    if not docs:
        print("[ingest] No content loaded from the provided files.")
        return 0

    splits = _TEXT_SPLITTER.split_documents(docs)
    get_vectorstore().add_documents(splits)
    print(f"[ingest] Stored {len(splits)} chunks from {len(file_paths)} file(s).")
    return len(splits)
