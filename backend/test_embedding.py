from app.services.embedding_service import generate_embedding

text = "DocuMind converts documents into searchable knowledge."

embedding = generate_embedding(text)

print(f"Embedding generated successfully")
print(f"Model dimension: {len(embedding)}")
print(f"First 5 values: {embedding[:5]}")
