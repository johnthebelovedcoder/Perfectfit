import type { ApiResponse, ApiError } from "@thread/types";
import { getAuth, setAuth, clearAuth } from "./auth";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

// Deduplicate concurrent refreshes — only one in flight at a time.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const auth = getAuth();
    if (!auth?.refreshToken) return null;
    try {
      const res = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
      if (!res.ok) { clearAuth(); return null; }
      const json = (await res.json()) as { data: { accessToken: string; refreshToken: string; user: typeof auth.user } };
      setAuth({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken, user: json.data.user });
      return json.data.accessToken;
    } catch {
      clearAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const hasExplicitAuth = !!(options.headers as Record<string, string> | undefined)?.["Authorization"];
  const token = hasExplicitAuth ? undefined : getAuth()?.accessToken;
  const res = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Buyer access token expired — refresh once, then retry.
  if (res.status === 401 && retry && !hasExplicitAuth && getAuth()?.refreshToken) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, false);
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || "error" in json) {
    const err = json as ApiError;
    throw new Error(err.error?.message ?? "Request failed");
  }

  return (json as { data: T }).data;
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};
