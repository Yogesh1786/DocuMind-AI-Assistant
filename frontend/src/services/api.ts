import type { Document } from "../types/document";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ============================================================
// Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiErrorResponse {
  detail?: string;
}

// ============================================================
// API Error
// ============================================================

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// ============================================================
// Generic API Request
// ============================================================

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;

  const isFormData = requestOptions.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,

    headers: {
      ...(isFormData
        ? {}
        : {
            "Content-Type": "application/json",
          }),

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...headers,
    },
  });

  if (!response.ok) {
    let message = "Something went wrong";

    try {
      const data: ApiErrorResponse = await response.json();

      if (data.detail) {
        message = data.detail;
      }
    } catch {
      // Ignore JSON parsing error
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================
// Authentication
// ============================================================

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ============================================================
// Users
// ============================================================

export async function getCurrentUser(token: string): Promise<User> {
  return apiRequest<User>("/api/users/me", {
    method: "GET",
    token,
  });
}

// ============================================================
// Documents
// ============================================================

export async function getDocuments(token: string): Promise<Document[]> {
  return apiRequest<Document[]>("/api/documents", {
    method: "GET",
    token,
  });
}

export async function getDocument(
  token: string,
  documentId: number,
): Promise<Document> {
  return apiRequest<Document>(`/api/documents/${documentId}`, {
    method: "GET",
    token,
  });
}

export async function uploadDocument(
  token: string,
  file: File,
): Promise<Document> {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest<Document>("/api/documents/upload", {
    method: "POST",
    token,
    body: formData,
  });
}

export async function deleteDocument(
  token: string,
  documentId: number,
): Promise<void> {
  return apiRequest<void>(`/api/documents/${documentId}`, {
    method: "DELETE",
    token,
  });
}
