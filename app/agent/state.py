"""
app/agent/state.py — LangGraph Agent State Schema

Defines the TypedDicts that describe:
  - EmailAgentState  : the shared state dict passed between every node
  - EmailClassification : the structured output from the LLM classifier

Rule: this file contains ONLY data structures. No logic.
"""

from typing import TypedDict, Literal


class EmailClassification(TypedDict):
    """Structured classification returned by the LLM in classify_intent."""
    intent: Literal["question", "bug", "billing", "feature", "complex"]
    urgency: Literal["low", "medium", "high", "critical"]
    topic: str      # short noun phrase, e.g. "password reset"
    summary: str    # one-sentence summary of the email


class EmailAgentState(TypedDict):
    """
    Shared state dictionary that flows through every node in the graph.

    Starts mostly empty (None) and gets filled as nodes execute:
      read_email        → fills: messages
      classify_intent   → fills: classification
      search_documentation / bug_tracking → fills: search_results
      draft_response    → fills: draft_response
    """
    # ── Input ────────────────────────────────────────────────────────────────
    email_content: str
    sender_email: str
    email_id: str

    # ── Filled by classify_intent ─────────────────────────────────────────
    classification: EmailClassification | None

    # ── Filled by search_documentation / bug_tracking ────────────────────
    search_results: list[str] | None
    customer_history: dict | None    # reserved for CRM integration

    # ── Filled by draft_response ─────────────────────────────────────────
    draft_response: str | None
    messages: list | None
