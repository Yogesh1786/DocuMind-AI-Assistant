import { useCallback, useEffect, useState } from "react";

import { deleteDocument, getDocuments, uploadDocument } from "../services/api";

import { useAuth } from "../context/AuthContext";

import type { Document } from "../types/document";

export default function Dashboard() {
  const { user, token, logout } = useAuth();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await getDocuments(token);

      setDocuments(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  async function handleUpload(file: File) {
    if (!token) {
      return;
    }

    try {
      setError("");

      await uploadDocument(token, file);

      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleDelete(documentId: number) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm("Delete this document?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteDocument(token, documentId);

      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const processedCount = documents.filter(
    (document) => document.status === "processed",
  ).length;

  const processingCount = documents.filter(
    (document) => document.status === "processing",
  ).length;

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>Manage and analyze your documents.</p>
        </div>

        <label className="upload-button">
          + Upload Document
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void handleUpload(file);
              }

              event.target.value = "";
            }}
            hidden
          />
        </label>
      </header>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics */}

      <section className="stats">
        <div className="stat-card">
          <span>Total Documents</span>

          <strong>{documents.length}</strong>
        </div>

        <div className="stat-card">
          <span>Processed</span>

          <strong>{processedCount}</strong>
        </div>

        <div className="stat-card">
          <span>Processing</span>

          <strong>{processingCount}</strong>
        </div>
      </section>

      {/* Documents */}

      <section className="documents-section">
        <div className="section-header">
          <h2>Your Documents</h2>
        </div>

        {loading ? (
          <div className="empty-state">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>

            <h3>No documents yet</h3>

            <p>Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="document-grid">
            {documents.map((document) => (
              <div className="document-card" key={document.id}>
                <div className="document-icon">📄</div>

                <div className="document-info">
                  <h4>{document.filename}</h4>

                  <span>{document.content_type}</span>

                  <small>{(document.file_size / 1024).toFixed(1)} KB</small>
                </div>

                <div className="document-actions">
                  <span className={`status ${document.status}`}>
                    {document.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(document.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
