from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.services.vector_search import search_similar_chunks

router = APIRouter(
    prefix="/api/search",
    tags=["Search"],
)


@router.post(
    "",
    response_model=SearchResponse,
)
def semantic_search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        chunks = search_similar_chunks(
            db=db,
            user_id=current_user.id,
            query=request.query,
            top_k=request.top_k,
        )

        results = [
            SearchResult(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                chunk_index=chunk.chunk_index,
                content=chunk.content,
            )
            for chunk in chunks
        ]

        return SearchResponse(results=results)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )
