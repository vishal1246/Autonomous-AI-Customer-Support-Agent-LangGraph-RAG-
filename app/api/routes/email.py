"""
app/api/routes/email.py — Email Agent Endpoints

POST /process-email  — run the LangGraph agent on an incoming customer email
POST /resume-email   — resume a paused agent after human review

Rule: this file contains ONLY HTTP routing. All agent logic is in app/agent/.
"""

import uuid

from fastapi import APIRouter, HTTPException
from langgraph.types import Command

from app.agent.graph import email_agent_graph
from app.models.schemas import EmailRequest, EmailResponse, ResumeRequest

router = APIRouter(tags=["Email Agent"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_final_state(config: dict) -> dict:
    """Read the latest state snapshot from the graph checkpointer."""
    snapshot = email_agent_graph.get_state(config)
    return snapshot.values if snapshot else {}


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

        return EmailResponse(
            email_id=final_state.get("email_id", request.thread_id),
            thread_id=request.thread_id,
            draft_response=final_state.get("draft_response"),
            classification=final_state.get("classification"),
            requires_human_review=False,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
