"use client";

const AUTH_KEY = "thread_admin_auth";

export interface AdminAuth {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string; emailVerified: boolean; mfaEnabled: boolean };
}

export function getAuth(): AdminAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AdminAuth) : null;
  } catch { return null; }
}

export function setAuth(state: AdminAuth): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  // Set a cookie hint so Next.js middleware can gate routes without reading localStorage
  document.cookie = `${AUTH_KEY}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  document.cookie = `${AUTH_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
