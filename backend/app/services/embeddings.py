from typing import List
from sentence_transformers import SentenceTransformer

# Model eka parak load karala, avoid slow
_model = SentenceTransformer("all-MiniLM-L6-v2")


def embed_text(chunks: List[str]) -> List[List[float]]:
    """
    Text chunks into    list  ,,, replace vector
    """
    embeddings = _model.encode(chunks)
    return embeddings.tolist()