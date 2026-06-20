import { getAuth, setAuth, clearAuth } from "./auth";
import type { ApiResponse, ApiError } from "@thread/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

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

      if (!res.ok) {
        clearAuth();
        if (typeof window !== "undefined") window.location.href = "/login";
        return null;
      }

      const json = (await res.json()) as { data: { accessToken: string; refreshToken: string; user: typeof auth.user } };
      setAuth({
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
        user: json.data.user,
      });
      return json.data.accessToken;
    } catch {
      clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const auth = getAuth();

  const res = await fetch(`${API_URL}/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, false);
    }
    throw new Error("Session expired. Please sign in again.");
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || "error" in json) {
    const err = json as ApiError;
    throw new Error(err.error?.message ?? "Request failed");
  }

  return (json as { data: T }).data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
