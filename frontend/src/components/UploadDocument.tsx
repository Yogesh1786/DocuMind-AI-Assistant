import { useRef, useState } from "react";

import type { ChangeEvent } from "react";

interface UploadDocumentProps {
  onUpload: (file: File) => Promise<void>;
}

export default function UploadDocument({ onUpload }: UploadDocumentProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      await onUpload(file);
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="upload-document">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleChange}
        hidden
      />

      <button
        type="button"
        className="upload-button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "+ Upload Document"}
      </button>

      <p>Supported formats: PDF, DOCX, TXT</p>

      <small>Maximum file size: 10 MB</small>
    </div>
  );
}
