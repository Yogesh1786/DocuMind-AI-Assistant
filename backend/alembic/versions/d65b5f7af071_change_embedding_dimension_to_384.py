"""change embedding dimension to 384

Revision ID: d65b5f7af071
Revises: abe1c29d10e9
Create Date: 2026-09-02 17:58:42.021037

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d65b5f7af071"
down_revision: Union[str, Sequence[str], None] = "abe1c29d10e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE document_chunks "
        "ALTER COLUMN embedding TYPE vector(384) "
        "USING NULL"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE document_chunks "
        "ALTER COLUMN embedding TYPE vector(1536) "
        "USING NULL"
    )
