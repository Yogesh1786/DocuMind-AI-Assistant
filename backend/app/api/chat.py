from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    SourceDocument,
)

from app.services.rag_service import retrieve_relevant_context
from app.services.llm_service import generate_answer

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


@router.post(
    "/ask",
    response_model=ChatResponse,
)
def ask_question(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    # -----------------------------------------
    # 1. Retrieve relevant document context
    # -----------------------------------------

    retrieval_result = retrieve_relevant_context(
        db=db,
        user_id=current_user.id,
        question=request.question,
        top_k=request.top_k,
    )

    # -----------------------------------------
    # 2. Get retrieved chunks
    # -----------------------------------------

    chunks = retrieval_result["chunks"]

    # -----------------------------------------
    # 3. Get formatted context
    # -----------------------------------------

    context = retrieval_result["context"]

    # -----------------------------------------
    # 4. Generate AI answer
    # -----------------------------------------

    answer = generate_answer(
        question=request.question,
        context=context,
    )

    # -----------------------------------------
    # 5. Create source information
    # -----------------------------------------

    sources = [
        SourceDocument(
            document_id=chunk.document_id,
            chunk_id=chunk.id,
            chunk_index=chunk.chunk_index,
        )
        for chunk in chunks
    ]

    # -----------------------------------------
    # 6. Return final response
    # -----------------------------------------

    return ChatResponse(
        answer=answer,
        sources=sources,
    )
