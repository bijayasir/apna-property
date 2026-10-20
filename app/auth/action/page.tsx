"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function EmailAction() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("Checking your account link…");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("oobCode") ?? "";
      if (!/^[A-Za-z0-9_-]{10,2048}$/.test(token)) { setMessage("This account link is invalid. Request a new email."); return; }
      if (params.get("mode") === "resetPassword") { window.location.replace(`/auth/reset-password?oobCode=${encodeURIComponent(token)}`); return; }
      window.history.replaceState(null, "", "/auth/action");
      if (params.get("mode") !== "verifyEmail") { setMessage("This account action is not supported. Request a new email."); return; }
      setCode(token); setMessage("Confirm your email to start your property journey.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  async function confirm() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ oobCode: code }) });
      const result = await response.json(); setMessage(result.message); setComplete(response.ok);
      if (response.ok) setCode("");
    } catch { setMessage("Unable to reach account services. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page"><Link className="auth-page-brand" href="/">ApnaProperty<span>.</span></Link><div className="auth-page-card auth-panel"><span className="eyebrow small">YOUR APNAPROPERTY ACCOUNT</span><h1>Confirm your email.</h1><p role={complete ? "status" : "alert"}>{message}</p>{code && <button className="primary auth-submit" disabled={busy} onClick={confirm}>{busy ? "Please wait…" : "Confirm email"}</button>}<Link className="auth-back" href="/">Return to ApnaProperty</Link></div></main>;
}
