"use client";

import { useEffect, useState } from "react";

/**
 * Tracks browser connectivity. Returns true when online.
 * Starts as `true` to match the server-rendered markup, then corrects on mount
 * to avoid a hydration mismatch.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
