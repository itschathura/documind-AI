import google.generativeai as genai
from typing import List
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)


def embed_text(chunks: List[str]) -> List[List[float]]:
    """
    Text chunks into list  ,,, replace vector using Gemini API
    """
    if not chunks:
        return []
        
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content=chunks
    )
    
    # When passing a list of chunks, result['embedding'] is a list of vectors
    return result['embedding']