"""
app/agent/graph.py — LangGraph Agent Graph

Wires the 7 nodes together into a compiled StateGraph.
Exports a singleton `email_agent_graph` used by the API routes.

Rule: this file contains ONLY graph wiring. Node logic is in nodes.py.
"""

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import RetryPolicy

from backend.agent.state import EmailAgentState
from backend.agent.nodes import (
    bug_tracking,
    classify_intent,
    draft_response,
    human_review,
    read_email,
    search_documentation,
    send_reply,
)


def build_graph() -> StateGraph:
    """Build and compile the email agent graph with an in-memory checkpointer."""
    workflow = StateGraph(EmailAgentState)

    # ── Register nodes ──────────────────────────────────────────────────────
    workflow.add_node("read_email", read_email)
    workflow.add_node("classify_intent", classify_intent)
    workflow.add_node(
        "search_documentation",
        search_documentation,
        retry_policy=RetryPolicy(max_attempts=3),  # retry on transient MongoDB errors
    )
    workflow.add_node("bug_tracking", bug_tracking)
    workflow.add_node("draft_response", draft_response)
    workflow.add_node("human_review", human_review)
    workflow.add_node("send_reply", send_reply)

    # ── Static edges (always go from A → B) ─────────────────────────────────
    workflow.add_edge(START, "read_email")
    workflow.add_edge("read_email", "classify_intent")
    workflow.add_edge("send_reply", END)

    # Dynamic edges (Command routing) are defined inside each node function.
    # classify_intent  → search_documentation | bug_tracking | human_review | draft_response
    # search_documentation → draft_response
    # bug_tracking         → draft_response
    # draft_response       → human_review | send_reply
    # human_review         → send_reply | END

    # ── Compile with MemorySaver for interrupt/resume support ────────────────
    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)


# Module-level singleton — imported by app/api/routes/email.py
email_agent_graph = build_graph()
