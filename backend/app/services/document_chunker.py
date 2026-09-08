import re

DEFAULT_CHUNK_SIZE = 1200
DEFAULT_CHUNK_OVERLAP = 200


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Remove excessive spaces while preserving paragraphs
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def chunk_text(
    text: str,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
) -> list[str]:

    if not text.strip():
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than zero")

    if chunk_overlap < 0:
        raise ValueError("chunk_overlap cannot be negative")

    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    text = normalize_text(text)

    paragraphs = [
        paragraph.strip()
        for paragraph in re.split(r"\n\s*\n", text)
        if paragraph.strip()
    ]

    chunks: list[str] = []
    current_chunk = ""

    for paragraph in paragraphs:

        # Handle a paragraph that is itself larger than the
        # maximum chunk size.
        if len(paragraph) > chunk_size:
            if current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = ""

            start = 0

            while start < len(paragraph):
                end = start + chunk_size
                piece = paragraph[start:end].strip()

                if piece:
                    chunks.append(piece)

                if end >= len(paragraph):
                    break

                start = end - chunk_overlap

            continue

        # Add paragraph to current chunk if it fits.
        candidate = f"{current_chunk}\n\n{paragraph}" if current_chunk else paragraph

        if len(candidate) <= chunk_size:
            current_chunk = candidate
            continue

        # Current chunk is full.
        if current_chunk:
            chunks.append(current_chunk.strip())

        # Start next chunk with overlap from the previous chunk.
        overlap_text = get_overlap_text(
            current_chunk,
            chunk_overlap,
        )

        current_chunk = f"{overlap_text}\n\n{paragraph}" if overlap_text else paragraph

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


def get_overlap_text(
    text: str,
    overlap_size: int,
) -> str:

    if not text or overlap_size <= 0:
        return ""

    return text[-overlap_size:].strip()
