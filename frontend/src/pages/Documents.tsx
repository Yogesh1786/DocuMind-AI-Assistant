import { useCallback, useEffect, useState } from "react";

import { deleteDocument, getDocuments, uploadDocument } from "../services/api";

import type { Document } from "../types/document";

import { useAuth } from "../context/AuthContext";

import DocumentCard from "../components/DocumentCard";
import UploadDocument from "../components/UploadDocument";

export default function Documents() {
  const { token } = useAuth();

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
      setError(
        err instanceof Error ? err.message : "Failed to upload document",
      );
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
      setError("");

      await deleteDocument(token, documentId);

      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document",
      );
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Documents</h1>

          <p>Manage and analyze your documents.</p>
        </div>
      </div>

      <section className="upload-section">
        <UploadDocument onUpload={handleUpload} />
      </section>

      {error && <div className="error-message">{error}</div>}

      <section className="documents-section">
        <div className="section-header">
          <h2>Your Documents</h2>

          <span>
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <h3>No documents yet</h3>

            <p>Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="documents-list">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
