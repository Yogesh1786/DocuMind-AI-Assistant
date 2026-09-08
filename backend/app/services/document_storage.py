from pathlib import Path
from uuid import uuid4

BASE_DIR = Path(__file__).resolve().parents[2]

DOCUMENT_STORAGE_DIR = BASE_DIR / "storage" / "documents"

DOCUMENT_STORAGE_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".txt",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def generate_stored_filename(extension: str) -> str:
    return f"{uuid4().hex}{extension}"
