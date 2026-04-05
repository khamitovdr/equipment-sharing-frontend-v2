import { useAuthStore } from "@/lib/stores/auth-store";

export const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_URL || "https://api.equip-me.ru/api/v1"
    : process.env.NEXT_PUBLIC_API_URL || "https://api.equip-me.ru/api/v1";

export class ApiRequestError extends Error {
  status: number;
  detail: string | unknown;

  constructor(status: number, detail: string | unknown) {
    super(typeof detail === "string" ? detail : "API Error");
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | boolean | null | undefined>;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, params } = options;

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      const json = await response.json();
      detail = json.detail ?? json;
    } catch {
      detail = response.statusText;
    }

    if (response.status === 401 && typeof window !== "undefined") {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    throw new ApiRequestError(response.status, detail);
  }

  return response.json() as Promise<T>;
}
