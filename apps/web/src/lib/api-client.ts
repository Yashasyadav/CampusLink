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

/** Map HTTP status codes or server detail arrays/strings to user-friendly messages */
export function parseApiError(status: number, serverMessage?: unknown): string {
  if (typeof serverMessage === "string" && serverMessage.trim().length > 0 && serverMessage.length < 200) {
    return serverMessage;
  }

  if (Array.isArray(serverMessage) && serverMessage.length > 0) {
    const messages = serverMessage
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          return (item as Record<string, unknown>).msg || (item as Record<string, unknown>).detail;
        }
        return null;
      })
      .filter((msg): msg is string => typeof msg === "string" && msg.length > 0);

    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  switch (status) {
    case 400: return "Please check the information you entered.";
    case 401: return "Invalid email or password. Please try again.";
    case 403: return "You don't have permission to access this resource.";
    case 404: return "We couldn't find the requested campus resource.";
    case 409: return "A conflict occurred. The resource may already exist.";
    case 422: return "Please check the input information format.";
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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
