"""
app/knowledge/retriever.py — Knowledge Base Retriever Tool

Exposes a single LangChain @tool that the LangGraph agent uses
to search MongoDB Atlas for relevant company documentation.

Called by: app/agent/nodes.py (search_documentation node)
"""

from langchain.tools import tool

from backend.knowledge.vectorstore import get_vectorstore


@tool
def retrieve_information(query: str) -> str:
    """
    Search the company knowledge base for information relevant to a customer query.

    Performs a cosine-similarity vector search against MongoDB Atlas
    and returns the top 4 most relevant document chunks.
    """
    try:
        retriever = get_vectorstore().as_retriever(search_kwargs={"k": 4})
        docs = retriever.invoke(query)

        if not docs:
            return "No relevant information found in the knowledge base."

        return "\n\n---\n\n".join(doc.page_content for doc in docs)

    except Exception as e:
        return f"Knowledge base search failed: {str(e)}"
