import google.generativeai as genai

from app.core.config import settings
from app.services.embeddings import embed_text
from app.services.vector_store import search_similar_chunks

genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel(settings.LLM_MODEL)


def answer_question(document_id: str, question: str) -> dict:
    query_vector = embed_text([question])[0]
    relevant_chunks = search_similar_chunks(query_vector, document_id=document_id, top_k=3)
    context = "\n\n".join(relevant_chunks)

    prompt = f"""You are answering questions based on the following document excerpts.
Only use the information provided below. If the answer isn't in the excerpts, say so.

Document excerpts:
{context}

Question: {question}

Answer:"""

    response = _model.generate_content(prompt)

    return {
        "answer": response.text,
        "sources": relevant_chunks,
    }


def generate_summary(text: str) -> str:
    """
   full extract text and summary print
    """
    prompt = f"""Summarize the following document in 3-5 concise sentences.
Focus on the key facts, purpose, and any important details.

Document:
{text}

Summary:"""

    response = _model.generate_content(prompt)
    return response.text