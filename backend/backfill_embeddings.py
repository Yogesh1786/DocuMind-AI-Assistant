from app.database import SessionLocal
from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import generate_embedding


def backfill_embeddings() -> None:
    db = SessionLocal()

    try:
        chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.embedding.is_(None))
            .order_by(DocumentChunk.id)
            .all()
        )

        if not chunks:
            print("No chunks need embeddings.")
            return

        print(f"Found {len(chunks)} chunk(s) without embeddings.")

        for chunk in chunks:
            print(
                f"Generating embedding for chunk "
                f"id={chunk.id}, document_id={chunk.document_id}, "
                f"chunk_index={chunk.chunk_index}"
            )

            chunk.embedding = generate_embedding(chunk.content)

        db.commit()

        print(f"Successfully generated embeddings for {len(chunks)} chunk(s).")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    backfill_embeddings()
