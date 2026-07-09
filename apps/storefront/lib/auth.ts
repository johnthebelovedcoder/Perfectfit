"use client";

import { useEffect, useState } from "react";

const KEY = "pf_auth";
export const AUTH_EVENT = "pf-auth-change";
const EVENT = AUTH_EVENT;

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}
export interface AuthState {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function setAuth(state: AuthState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  notify();
}

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "null") as AuthState | null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  notify();
}

/** Reactive auth state for client components (header, account pages). */
export function useAuth(): AuthState | null {
  const [auth, setAuthState] = useState<AuthState | null>(null);
  useEffect(() => {
    setAuthState(getAuth());
    const handler = () => setAuthState(getAuth());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return auth;
}
