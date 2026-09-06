import { env } from "@/config/env";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Map HTTP status codes to user-friendly messages */
export function parseApiError(status: number, serverMessage?: string): string {
  if (serverMessage && serverMessage.length < 200) return serverMessage;
  switch (status) {
    case 400: return "Please check the information you entered.";
    case 401: return "Your session has expired. Please sign in again.";
    case 403: return "You don't have permission to access this resource.";
    case 404: return "We couldn't find the requested campus resource.";
    case 409: return "A conflict occurred. The resource may already exist.";
    case 422: return "Please check the information you entered.";
    case 429: return "Too many requests. Please wait a moment and try again.";
    case 500:
    case 502:
    case 503:
      return "CampusLink encountered a server error. Please try again.";
    default:  return `An unexpected error occurred (${status}). Please try again.`;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${env.apiUrl}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const serverMsg = errorData?.detail || errorData?.message;
    const userMessage = parseApiError(response.status, serverMsg);
    throw new ApiError(userMessage, response.status, errorData);
  }

  return response.json() as Promise<T>;
}
