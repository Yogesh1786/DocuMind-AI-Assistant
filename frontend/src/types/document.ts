export interface Document {
  id: number;
  filename: string;
  content_type: string;
  file_size: number;
  status: string;
  created_at: string;
  updated_at: string;
  extracted_text?: string | null;
}
