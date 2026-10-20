"use client";
import { AuthPanel } from "../../components/auth/auth-panel";
import { useAuth } from "../../components/auth/use-auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ResetPassword() {
  const auth = useAuth();
  const [resetCode, setResetCode] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const code = new URLSearchParams(window.location.search).get("oobCode") ?? "";
      if (/^[A-Za-z0-9_-]{10,2048}$/.test(code)) setResetCode(code);
      window.history.replaceState(null, "", "/auth/reset-password");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <main className="auth-page"><Link className="auth-page-brand" href="/">ApnaProperty<span>.</span></Link><div className="auth-page-card"><AuthPanel configured={auth.configured} serviceError={auth.serviceError} onRetry={auth.refresh} onUser={auth.setUser} initialMode="reset" resetCode={resetCode} /></div></main>;
}
