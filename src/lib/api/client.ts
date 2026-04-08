import { useAuthStore } from "@/lib/stores/auth-store";

// Client-side requests go through Next.js proxy (/api/v1 -> api.equip-me.ru/api/v1)
// Server-side requests go directly to the API
// Must be a function — module-level typeof window checks get inlined by the bundler
function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL || "https://api.equip-me.ru/api/v1";
  }
  return "/api/v1";
}

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
  params?: Record<string, string | string[] | number | boolean | null | undefined>;
  skipAuthRedirect?: boolean;
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token, params, skipAuthRedirect } = options;

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let url = `${getApiBaseUrl()}${path}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value == null || value === "") continue;
      if (Array.isArray(value)) {
        for (const v of value) searchParams.append(key, v);
      } else {
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

    if (response.status === 401 && typeof window !== "undefined" && token && !skipAuthRedirect) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }

    throw new ApiRequestError(response.status, detail);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
