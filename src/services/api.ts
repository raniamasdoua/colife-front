export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function getToken(): string | null {
  return localStorage.getItem("accessToken");
}

/** Erreur HTTP renvoyée par l’API (corps JSON typique : { message, status, ... }). */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
      throw new ApiRequestError("Session expirée ou non authentifié.", 401);
    }

    let message = `Erreur ${response.status}`;
    try {
      const body = await parseJsonBody<{ message?: string }>(response);
      if (body?.message && typeof body.message === "string") {
        message = body.message;
      }
    } catch {
      /* corps non JSON */
    }
    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return parseJsonBody<T>(response);
}