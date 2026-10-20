"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthUser } from "../../lib/auth/validation";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [serviceError, setServiceError] = useState("");
  const revision = useRef(0);
  const updateUser = useCallback((next: AuthUser | null) => { revision.current++; setUser(next); }, []);
  const refresh = useCallback(async () => {
    const current = ++revision.current;
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" });
      if (response.ok) { const data = await response.json(); if (current === revision.current) { setUser(data.user); setConfigured(data.configured); setServiceError(""); } }
      else if (current === revision.current) setServiceError("Account services are temporarily unavailable. Please retry.");
    } catch { if (current === revision.current) setServiceError("Unable to reach account services. Check your connection and retry."); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const current = ++revision.current;
    fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async response => { if (response.ok) { const data = await response.json(); if (current === revision.current) { setUser(data.user); setConfigured(data.configured); setServiceError(""); } } else if (current === revision.current) setServiceError("Account services are temporarily unavailable. Please retry."); })
      .catch(() => { if (!controller.signal.aborted && current === revision.current) setServiceError("Unable to reach account services. Check your connection and retry."); });
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(onFocus, 60000);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); window.clearInterval(timer); };
  }, [refresh]);
  return { user, setUser: updateUser, configured, refresh, serviceError };
}
