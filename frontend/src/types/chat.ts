export interface ChatSource {
  document_id: number;
  chunk_id: number;
  chunk_index: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}
