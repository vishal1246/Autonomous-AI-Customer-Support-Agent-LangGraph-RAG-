"""
app/agent/nodes.py — LangGraph Node Functions

Each function is one node in the email agent graph.
Nodes read from state, do work, and return either:
  - dict        : plain state update
  - Command(update, goto) : state update + explicit next-node routing

Execution order (see graph.py for wiring):
  read_email → classify_intent → [search_documentation | bug_tracking | human_review]
                               → draft_response → [human_review | send_reply]

Rule: this file contains ONLY node logic. Graph wiring is in graph.py.
"""

from typing import Literal

from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END
from langgraph.types import Command, interrupt

from app.agent.state import EmailAgentState, EmailClassification
from app.core.config import get_google_api_key
from app.knowledge.retriever import retrieve_information


# ---------------------------------------------------------------------------
# LLM factory — creates a fresh instance on every call (not at import time)
# ---------------------------------------------------------------------------

def _get_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model="gemini-3.5-flash",
        google_api_key=get_google_api_key(),
        temperature=0,
    )


# ---------------------------------------------------------------------------
# Node 1: read_email
# ---------------------------------------------------------------------------

def read_email(state: EmailAgentState) -> dict:
    """
    Parse the incoming email and initialise the message thread.
    Updates: messages
    """
    return {
        "messages": [
            HumanMessage(
                content=f"Processing email from {state['sender_email']}:\n{state['email_content']}"
            )
        ]
    }


# ---------------------------------------------------------------------------
# Node 2: classify_intent  (the router)
# ---------------------------------------------------------------------------

def classify_intent(
    state: EmailAgentState,
) -> Command[Literal["search_documentation", "human_review", "draft_response", "bug_tracking"]]:
    """
    Ask the LLM to classify the email, then route to the appropriate next node.

    Routing logic:
      billing intent  OR critical urgency  → human_review   (skip drafting)
      question / feature intent            → search_documentation
      bug intent                           → bug_tracking
      complex intent (else)                → draft_response
    """
    structured_llm = _get_llm().with_structured_output(EmailClassification)

    prompt = f"""You are a customer support classifier. Analyze the following email and return a structured classification.

Email: {state['email_content']}
From: {state['sender_email']}

Classify the intent as one of: question, bug, billing, feature, complex
Classify the urgency as one of: low, medium, high, critical
Provide the topic (short noun phrase) and a one-sentence summary."""

    classification = structured_llm.invoke(prompt)

    if classification["intent"] == "billing" or classification["urgency"] == "critical":
        goto = "human_review"
    elif classification["intent"] in ["question", "feature", "complex"]:
        goto = "search_documentation"
    elif classification["intent"] == "bug":
        goto = "bug_tracking"
    else:
        goto = "draft_response"

    print(f"[classify_intent] intent={classification.get('intent')} urgency={classification.get('urgency')} → {goto}")
    return Command(update={"classification": classification}, goto=goto)


# ---------------------------------------------------------------------------
# Node 3: search_documentation
# ---------------------------------------------------------------------------

def search_documentation(
    state: EmailAgentState,
) -> Command[Literal["draft_response"]]:
    """
    Query the company knowledge base (MongoDB Atlas) for relevant documentation.
    Updates: search_results
    Always routes to: draft_response
    """
    classification = state.get("classification") or {}
    query = state["email_content"][:500]

    print(f"[search_documentation] Query: {query!r}")
    try:
        result = retrieve_information.invoke(query)
        print(f"[search_documentation] Retrieved: {result[:300]!r}")
        search_results = [result] if result else ["No relevant documentation found."]
    except Exception as e:
        search_results = [f"Knowledge base temporarily unavailable: {str(e)}"]

    return Command(update={"search_results": search_results}, goto="draft_response")


# ---------------------------------------------------------------------------
# Node 4: bug_tracking
# ---------------------------------------------------------------------------

def bug_tracking(
    state: EmailAgentState,
) -> Command[Literal["draft_response"]]:
    """
    Create a bug ticket.
    TODO: Replace the stub with your issue tracker API (Jira, GitHub Issues, etc.)
    Updates: search_results (with ticket confirmation message)
    Always routes to: draft_response
    """
    ticket_id = f"BUG-{abs(hash(state['email_content'])) % 90000 + 10000}"
    return Command(
        update={
            "search_results": [
                f"Bug ticket {ticket_id} has been created and assigned to the engineering team. "
                "The team will investigate and update you within 24 hours."
            ]
        },
        goto="draft_response",
    )


# ---------------------------------------------------------------------------
# Node 5: draft_response
# ---------------------------------------------------------------------------

def draft_response(
    state: EmailAgentState,
) -> Command[Literal["human_review", "send_reply"]]:
    """
    Use the LLM to write a professional reply, grounded in the retrieved docs.
    Updates: draft_response
    Routes to: human_review (if high/critical urgency or complex intent)
               send_reply   (otherwise)
    """
    llm = _get_llm()
    classification = state.get("classification") or {}

    # Build context from whatever was gathered in previous nodes
    context_parts = []
    if state.get("search_results"):
        docs_text = "\n".join(f"  • {doc}" for doc in state["search_results"])
        context_parts.append(f"Relevant company documentation:\n{docs_text}")
    if state.get("customer_history"):
        tier = state["customer_history"].get("tier", "standard")
        context_parts.append(f"Customer account tier: {tier}")

    context = "\n\n".join(context_parts) if context_parts else "No additional context available."

    prompt = f"""Draft a professional and empathetic customer support response.

Original Email:
{state['email_content']}

Classification:
  - Intent:  {classification.get('intent', 'unknown')}
  - Urgency: {classification.get('urgency', 'medium')}
  - Topic:   {classification.get('topic', '')}

{context}

Guidelines:
  - Be warm, professional, and concise
  - Directly address the customer's concern
  - Reference the documentation when it answers their question
  - If a bug ticket was created, mention the ticket ID
  - Sign off as "Customer Support Team"
"""

    response = llm.invoke(prompt)

    # Extract text if response.content is a list of content blocks
    if isinstance(response.content, list):
        draft_text = "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in response.content
        )
    else:
        draft_text = str(response.content)

    needs_review = (
        classification.get("urgency") in ["high", "critical"]
        or classification.get("intent") == "complex"
    )
    goto = "human_review" if needs_review else "send_reply"

    return Command(update={"draft_response": draft_text}, goto=goto)



# ---------------------------------------------------------------------------
# Node 6: human_review
# ---------------------------------------------------------------------------

def human_review(
    state: EmailAgentState,
) -> Command[Literal["send_reply", END]]:
    """
    Pause the graph and present the draft to a human agent for review.

    The graph STOPS here until POST /resume-email is called with:
      {"approved": true,  "edited_response": "..."} → continues to send_reply
      {"approved": false}                            → ends (human handles directly)
    """
    classification = state.get("classification") or {}

    human_decision = interrupt({
        "email_id": state.get("email_id", ""),
        "original_email": state.get("email_content", ""),
        "draft_response": state.get("draft_response", ""),
        "urgency": classification.get("urgency"),
        "intent": classification.get("intent"),
        "action": "Please review and approve/edit this response",
    })

    if human_decision.get("approved"):
        edited = human_decision.get("edited_response", state.get("draft_response", ""))
        return Command(update={"draft_response": edited}, goto="send_reply")

    # Human rejected — they will handle this email directly
    return Command(update={}, goto=END)


# ---------------------------------------------------------------------------
# Node 7: send_reply
# ---------------------------------------------------------------------------

def send_reply(state: EmailAgentState) -> dict:
    """
    Send the final email reply.
    TODO: Replace print() with your email provider (SendGrid, AWS SES, Gmail API, etc.)
    """
    draft = state.get("draft_response", "")
    print(f"[Agent] ✉  Sending reply to {state['sender_email']}:\n{draft[:200]}...")
    return {}
