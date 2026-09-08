import type { Document } from "../types/document";

interface DocumentCardProps {
  document: Document;
  onDelete: (documentId: number) => void;
}

export default function DocumentCard({
  document,
  onDelete,
}: DocumentCardProps) {
  const fileSizeKb = (document.file_size / 1024).toFixed(1);

  return (
    <div className="document-card">
      <div className="document-icon">📄</div>

      <div className="document-info">
        <h4>{document.filename}</h4>

        <span>{document.content_type}</span>

        <small>{fileSizeKb} KB</small>
      </div>

      <div className="document-actions">
        <span className={`status ${document.status}`}>{document.status}</span>

        <button type="button" onClick={() => onDelete(document.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
