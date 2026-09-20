"""
app/api/routes/email.py — Email Agent Endpoints

POST /process-email  — run the LangGraph agent on an incoming customer email
POST /resume-email   — resume a paused agent after human review
GET  /review-queue   — list all emails currently awaiting human review

Rule: this file contains ONLY HTTP routing. All agent logic is in app/agent/.
"""

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, HTTPException
from langgraph.types import Command
from pymongo.errors import DuplicateKeyError

from backend.agent.graph import email_agent_graph
from backend.db.mongo import review_queue_col
from backend.schemas.email import EmailRequest, EmailResponse, ResumeRequest, ReviewItemSchema

router = APIRouter(tags=["Email Agent"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_final_state(config: dict) -> dict:
    """Read the latest state snapshot from the graph checkpointer."""
    snapshot = email_agent_graph.get_state(config)
    return snapshot.values if snapshot else {}


def _iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# POST /process-email
# ---------------------------------------------------------------------------

@router.post("/process-email", response_model=EmailResponse)
async def process_email(request: EmailRequest):
    """
    Run the email agent on an incoming customer email.

    The agent will:
    1. Classify the email (question / bug / billing / feature / complex)
    2. Search the knowledge base or log a bug ticket
    3. Draft a professional reply
    4. Either send automatically or flag for human review

    If `requires_human_review` is **true**, call POST /resume-email with the returned `thread_id`.
    """
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    initial_state = {
        "email_content": request.email_content,
        "sender_email": request.sender_email,
        "email_id": request.email_id or thread_id,
        "classification": None,
        "search_results": None,
        "customer_history": None,
        "draft_response": None,
        "messages": None,
    }

    try:
        interrupted = False

        for event in email_agent_graph.stream(initial_state, config, stream_mode="values"):
            if "__interrupt__" in event:
                interrupted = True
                break

        final_state = _get_final_state(config)

        # ── Persist to MongoDB if human review is required ───────────────────
        if interrupted:
            classification = final_state.get("classification") or {}
            if hasattr(classification, "model_dump"):
                classification = classification.model_dump()

            doc = {
                "email_id": request.email_id or thread_id,
                "thread_id": thread_id,
                "sender_email": request.sender_email,
                "email_content": request.email_content,
                "draft_response": final_state.get("draft_response") or "",
                "classification": classification,
                "timestamp": _iso_now(),
                "jira_ticket": final_state.get("jira_ticket"),
            }

            try:
                review_queue_col().insert_one(doc)
            except DuplicateKeyError:
                pass  # already in queue (idempotent)

        return EmailResponse(
            email_id=request.email_id or thread_id,
            thread_id=thread_id,
            draft_response=final_state.get("draft_response"),
            classification=final_state.get("classification"),
            requires_human_review=interrupted,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# POST /resume-email
# ---------------------------------------------------------------------------

@router.post("/resume-email", response_model=EmailResponse)
async def resume_email(request: ResumeRequest):
    """
    Resume a paused email agent after human review.

    - `approved: true`  → sends the reply (with optional `edited_response`)
    - `approved: false` → discards the draft; human handles the email directly
    """
    config = {"configurable": {"thread_id": request.thread_id}}
    resume_payload = {
        "approved": request.approved,
        "edited_response": request.edited_response,
    }

    try:
        for _ in email_agent_graph.stream(
            Command(resume=resume_payload), config, stream_mode="values"
        ):
            pass

        final_state = _get_final_state(config)

        # ── Remove from MongoDB review queue once resolved ───────────────────
        review_queue_col().delete_one({"thread_id": request.thread_id})

        return EmailResponse(
            email_id=final_state.get("email_id", request.thread_id),
            thread_id=request.thread_id,
            draft_response=final_state.get("draft_response"),
            classification=final_state.get("classification"),
            requires_human_review=False,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /review-queue
# ---------------------------------------------------------------------------

@router.get("/review-queue", response_model=List[ReviewItemSchema])
async def get_review_queue():
    """
    Return all emails currently waiting for human review, newest-first.
    """
    col = review_queue_col()
    docs = list(col.find({}, {"_id": 0}).sort("timestamp", -1))
    return docs
