import { apiRequest } from "./api";

import type { ChatResponse } from "../types/chat";

export async function askQuestion(
  token: string,
  question: string,
  topK: number = 5,
): Promise<ChatResponse> {
  return apiRequest<ChatResponse>("/api/chat/ask", {
    method: "POST",

    token,

    body: JSON.stringify({
      question,
      top_k: topK,
    }),
  });
}
