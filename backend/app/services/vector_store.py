from typing import List
import chromadb

from app.core.config import settings


# chromadb.Client() = in memeory temporary
# PersistentClient = save in disk
_client = chromadb.PersistentClient(path=settings.VECTOR_DB_PATH)

# table ekk wage

# create_collection(...)
# get_or_create_collection = app eka restart > continue without erros

_collection = _client.get_or_create_collection(name="documents")


def add_document_chunks(document_id: str, chunks: List[str], vectors: List[List[float]]) -> None:
    """
    Document > chunks + vectors, .
    """
    ids = [f"doc{document_id}_chunk{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "chunk_index": i} for i in range(len(chunks))]

    _collection.add(
        ids=ids,
        embeddings=vectors,
        documents=chunks,
        metadatas=metadatas,
    )


def search_similar_chunks(query_vector: List[float], document_id: str, top_k: int = 5) -> List[str]:
    """
 ###########################
    """
    results = _collection.query(
        query_embeddings=[query_vector],
        n_results=top_k,
        where={"document_id": document_id},
    )
    return results["documents"][0]  # matched chunk texts list


def delete_document_chunks(document_id: str) -> None:
    """
    Delete all chunks belonging to a specific document from ChromaDB.
    """
    _collection.delete(where={"document_id": document_id})