from app.services.embedding_service import (
    EMBEDDING_DIMENSION,
    generate_embedding,
)

text = "DocuMind converts documents into searchable knowledge."

embedding = generate_embedding(text)

print("Embedding service working successfully")
print(f"Embedding dimension: {len(embedding)}")
print(f"Expected dimension: {EMBEDDING_DIMENSION}")
print(f"First 5 values: {embedding[:5]}")
