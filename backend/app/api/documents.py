import os

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.document_chunker import chunk_text
from app.services.document_parser import extract_text
from app.services.embedding_service import generate_embedding
from app.services.document_storage import (
    ALLOWED_EXTENSIONS,
    DOCUMENT_STORAGE_DIR,
    MAX_FILE_SIZE,
    generate_stored_filename,
    get_file_extension,
)

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"],
)


CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200
UPLOAD_CHUNK_SIZE = 1024 * 1024


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload and process a document.

    Flow:
    1. Validate filename
    2. Validate extension
    3. Save file to storage
    4. Create document database record
    5. Extract text
    6. Create document chunks
    7. Store chunks in database
    8. Mark document as processed
    """

    # ---------------------------------------------------------
    # 1. Validate filename
    # ---------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    # Normalize filename to prevent path traversal.
    original_filename = os.path.basename(file.filename.replace("\\", "/"))

    # ---------------------------------------------------------
    # 2. Validate file extension
    # ---------------------------------------------------------

    extension = get_file_extension(original_filename)

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=("Unsupported file type. " "Allowed types: PDF, DOCX, TXT"),
        )

    # ---------------------------------------------------------
    # 3. Prepare storage information
    # ---------------------------------------------------------

    content_type = file.content_type or "application/octet-stream"

    stored_filename = generate_stored_filename(extension)
    destination = DOCUMENT_STORAGE_DIR / stored_filename

    total_size = 0

    try:
        # -----------------------------------------------------
        # 4. Save uploaded file
        # -----------------------------------------------------

        with destination.open("wb") as output_file:
            while True:
                chunk = file.file.read(UPLOAD_CHUNK_SIZE)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE),
                        detail="File size exceeds the 10 MB limit",
                    )

                output_file.write(chunk)

        # -----------------------------------------------------
        # 5. Create document database record
        # -----------------------------------------------------

        document = Document(
            user_id=current_user.id,
            filename=original_filename,
            stored_filename=stored_filename,
            content_type=content_type,
            file_size=total_size,
            status="processing",
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # -----------------------------------------------------
        # 6. Extract text
        # -----------------------------------------------------

        extracted_text = extract_text(
            destination,
            content_type,
        ).strip()

        if not extracted_text:
            document.status = "failed"

            db.commit()

            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=("No readable text could be extracted " "from the document"),
            )

        # -----------------------------------------------------
        # 7. Save extracted text
        # -----------------------------------------------------

        document.extracted_text = extracted_text

        # -----------------------------------------------------
        # 8. Create document chunks
        # -----------------------------------------------------

        chunks = chunk_text(
            extracted_text,
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
        )

        if not chunks:
            document.status = "failed"

            db.commit()

            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Document could not be split into chunks",
            )

        # -----------------------------------------------------
        # 9. Save chunks to database
        # -----------------------------------------------------

        for chunk_index, content in enumerate(chunks):
            embedding = generate_embedding(content)

            document_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=chunk_index,
                content=content,
                embedding=embedding,
            )

            db.add(document_chunk)

        # -----------------------------------------------------
        # 10. Mark document as processed
        # -----------------------------------------------------

        document.status = "processed"

        db.commit()
        db.refresh(document)

        # -----------------------------------------------------
        # 11. Return document
        # -----------------------------------------------------

        return document

    except HTTPException:
        db.rollback()

        if destination.exists():
            destination.unlink()

        raise

    except Exception:
        db.rollback()

        if destination.exists():
            destination.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process document",
        )

    finally:
        file.file.close()


@router.get(
    "",
    response_model=list[DocumentResponse],
)
def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    documents = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )

    return documents


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    file_path = DOCUMENT_STORAGE_DIR / document.stored_filename

    if file_path.exists():
        file_path.unlink()

    db.delete(document)
    db.commit()

    return None
