from sqlalchemy.orm import Session

from app.services.vector_search import search_similar_chunks


def retrieve_relevant_context(
    db: Session,
    user_id: int,
    question: str,
    top_k: int = 5,
):
    chunks = search_similar_chunks(
        db=db,
        user_id=user_id,
        query=question,
        top_k=top_k,
    )

    context_parts = []

    for chunk in chunks:
        context_parts.append(f"""
DOCUMENT ID: {chunk.document_id}
CHUNK INDEX: {chunk.chunk_index}

{chunk.content}
""")

    context = "\n\n---\n\n".join(context_parts)

    return {
        "context": context,
        "chunks": chunks,
    }
