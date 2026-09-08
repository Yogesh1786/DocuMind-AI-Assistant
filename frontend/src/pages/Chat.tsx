import { useState } from "react";
import { askQuestion, type ChatResponse } from "../services/chat";
import { useAuth } from "../context/AuthContext";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: ChatResponse["sources"];
}

const suggestedQuestions = [
  "What programming languages does this candidate know?",
  "Summarize the uploaded documents.",
  "What are the candidate's strongest technical skills?",
  "What work experience is mentioned?",
];

export default function Chat() {
  const { token } = useAuth();

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAskQuestion(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    if (!token) {
      setError("You are not authenticated. Please log in again.");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);

    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await askQuestion(token, trimmedQuestion);

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.answer,
        sources: response.sources,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to get an AI response. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSuggestedQuestion(suggestedQuestion: string) {
    setQuestion(suggestedQuestion);
  }

  function handleClearChat() {
    setMessages([]);
    setQuestion("");
    setError("");
  }

  return (
    <div className="chat-page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="chat-header">
        <div>
          <div className="chat-title-row">
            <div className="chat-header-icon">✨</div>

            <div>
              <h1>AI Document Assistant</h1>

              <p>Ask questions and get answers from your uploaded documents.</p>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="clear-chat-button"
            onClick={handleClearChat}
          >
            Clear Chat
          </button>
        )}
      </header>

      {/* ======================================================
          CHAT CONTENT
      ====================================================== */}

      <div className="chat-content">
        {/* Empty / Welcome State */}

        {messages.length === 0 && !loading && (
          <div className="chat-welcome">
            <div className="welcome-icon">🤖</div>

            <h2>How can I help you today?</h2>

            <p>
              Ask anything about the documents you have uploaded to DocuMind.
              I'll search through the relevant information and provide an
              answer.
            </p>

            <div className="suggested-questions">
              <h3>Try asking:</h3>

              <div className="suggestion-grid">
                {suggestedQuestions.map((suggestedQuestion) => (
                  <button
                    key={suggestedQuestion}
                    type="button"
                    className="suggestion-card"
                    onClick={() => handleSuggestedQuestion(suggestedQuestion)}
                  >
                    <span className="suggestion-icon">✦</span>

                    <span>{suggestedQuestion}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}

        {messages.length > 0 && (
          <div className="messages-container">
            {messages.map((message) => (
              <div key={message.id} className={`message-row ${message.role}`}>
                {/* Avatar */}

                <div className="message-avatar">
                  {message.role === "user" ? "👤" : "🤖"}
                </div>

                {/* Message */}

                <div className="message-content">
                  <div className="message-meta">
                    <strong>
                      {message.role === "user" ? "You" : "DocuMind AI"}
                    </strong>
                  </div>

                  <div className={`message-bubble ${message.role}`}>
                    {message.content}
                  </div>

                  {/* Sources */}

                  {message.role === "assistant" &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <div className="message-sources">
                        <div className="sources-title">📚 Sources</div>

                        <div className="source-list">
                          {message.sources.map((source, index) => (
                            <div
                              key={`${source.document_id}-${source.chunk_id}-${index}`}
                              className="source-chip"
                            >
                              <span>📄</span>

                              <span>Document #{source.document_id}</span>

                              <small>Chunk {source.chunk_index + 1}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {/* AI Loading */}

            {loading && (
              <div className="message-row assistant">
                <div className="message-avatar">🤖</div>

                <div className="message-content">
                  <div className="message-meta">
                    <strong>DocuMind AI</strong>
                  </div>

                  <div className="ai-thinking">
                    <span />
                    <span />
                    <span />

                    <p>Searching your documents...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="chat-error">
            <span>⚠️</span>

            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ======================================================
          INPUT AREA
      ====================================================== */}

      <div className="chat-input-wrapper">
        <form className="chat-input-container" onSubmit={handleAskQuestion}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask anything about your documents..."
            rows={1}
            disabled={loading}
          />

          <button
            type="submit"
            className="send-button"
            disabled={!question.trim() || loading}
            aria-label="Send question"
          >
            {loading ? "..." : "➤"}
          </button>
        </form>

        <p className="chat-input-hint">
          DocuMind AI answers based on your uploaded documents.
        </p>
      </div>
    </div>
  );
}
