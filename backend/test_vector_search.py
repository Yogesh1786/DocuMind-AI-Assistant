from app.database import SessionLocal
from app.services.vector_search import search_similar_chunks

db = SessionLocal()

try:
    results = search_similar_chunks(
        db=db,
        user_id=1,
        query="What skills and technologies does this candidate have?",
        top_k=5,
    )

    print(f"Found {len(results)} result(s)")

    for result in results:
        print("\n---")
        print(f"Chunk ID: {result.id}")
        print(f"Document ID: {result.document_id}")
        print(f"Chunk Index: {result.chunk_index}")
        print(f"Content:\n{result.content}")

finally:
    db.close()
