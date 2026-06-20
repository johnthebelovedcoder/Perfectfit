"use client";

const AUTH_KEY = "thread_seller_auth";

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    mfaEnabled?: boolean;
  };
}

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function setAuth(state: AuthState): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(state));
  // Set a cookie hint so Next.js middleware can gate routes without reading localStorage
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AUTH_KEY}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`;
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
  document.cookie = `${AUTH_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
