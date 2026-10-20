"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { accountTypes, blankAuthFields, validateAuth, type AuthFields, type AuthMode, type AuthUser, type FieldErrors } from "../../lib/auth/validation";

export function AuthPanel({ user = null, configured, onUser, initialMode = "login", serviceError = "", onRetry, resetCode = "" }: { user?: AuthUser | null; configured: boolean | null; onUser: (user: AuthUser | null) => void; initialMode?: AuthMode; serviceError?: string; onRetry?: () => Promise<void>; resetCode?: string }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fields, setFields] = useState<AuthFields>({ ...blankAuthFields });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  function switchMode(next: AuthMode) { setMode(next); setFields({ ...blankAuthFields }); setErrors({}); setMessage(""); setSuccess(false); setShowPassword(false); }
  function change(name: keyof AuthFields, value: string | boolean) { setFields(current => ({ ...current, [name]: value })); setErrors(current => ({ ...current, [name]: undefined })); setMessage(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSuccess(false);
    const invalid = validateAuth(fields, mode); setErrors(invalid);
    if (Object.keys(invalid).length) { event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus(); return; }
    if (mode === "reset" && !resetCode) { setMessage("Your reset link is invalid or expired. Request a new reset email."); return; }
    if (!configured) { setMessage("Authentication is not configured yet. Account services need to be enabled before you can continue."); return; }
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, ...(mode === "reset" ? { oobCode: resetCode } : {}) }) });
      const data = await response.json();
      setErrors(data.errors ?? {}); setMessage(data.message ?? ""); setSuccess(response.ok);
      if (response.ok) { setFields(current => ({ ...current, password: "", confirmPassword: "" })); if (data.user) onUser(data.user); if (mode === "reset") onUser(null); }
    } catch { setMessage("Unable to reach account services. Please try again."); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error();
      onUser(null); switchMode("login");
    } catch { setMessage("Unable to sign out. Please try again."); }
    finally { setBusy(false); }
  }
  const titles = { login: "Welcome back.", signup: "Your next chapter starts here.", forgot: "Forgot your password?", reset: "Set a new password." };
  function field(name: Exclude<keyof AuthFields, "remember" | "accountType">, label: string, autoComplete: string, type = "text") {
    const password = name === "password" || name === "confirmPassword";
    return <div className="auth-field" key={name}><label htmlFor={`auth-${name}`}>{label}</label><div className="auth-input-wrap"><input id={`auth-${name}`} name={name} type={password ? showPassword ? "text" : "password" : type} value={fields[name]} onChange={e => change(name, e.target.value)} autoComplete={autoComplete} inputMode={name === "mobile" ? "tel" : name === "email" ? "email" : undefined} maxLength={name === "fullName" ? 100 : name === "email" ? 254 : name === "mobile" ? 20 : 128} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${name}` : name === "password" && mode !== "login" ? "password-help" : undefined} required />{password && <button type="button" className="password-toggle" aria-label={`${showPassword ? "Hide" : "Show"} ${name === "confirmPassword" ? "confirm password" : "password"}`} aria-pressed={showPassword} onClick={() => setShowPassword(current => !current)}>{showPassword ? "Hide" : "Show"}</button>}</div>{errors[name] && <span className="field-error" id={`error-${name}`}>{errors[name]}</span>}</div>;
  }
  if (user && initialMode !== "reset") return <div className="auth-panel"><span className="eyebrow small">YOUR APNAPROPERTY ACCOUNT</span><h2 id="dialog-title">Hello, {user.name}.</h2><dl className="detail-facts"><div><dt>Email address</dt><dd>{user.email}</dd></div><div><dt>Account type</dt><dd>{user.accountType}</dd></div><div><dt>Mobile number</dt><dd>{user.mobile || "Not supplied"}</dd></div><div><dt>Mobile verification</dt><dd>Not verified</dd></div></dl><p>Account type describes your property interests. Owner and agent permissions will be verified separately.</p>{message && <p role="alert">{message}</p>}<button className="primary" disabled={busy} onClick={logout}>{busy ? "Signing out…" : "Logout"}</button></div>;
  return <div className="auth-panel"><span className="eyebrow small">APNAPROPERTY · YOUR PLACE, YOUR PEOPLE</span><h2 id="dialog-title">{titles[mode]}</h2><p className="auth-intro">{mode === "signup" ? "Create an account for your next property journey." : mode === "forgot" ? "Enter your email and we’ll help you get back to your account." : mode === "reset" ? "Choose a strong, unique password for your account." : "Log in to your property journey."}</p>
    {configured === false && <div className="auth-setup" role="status">Account services are not enabled yet. You can explore these forms; no account will be created until authentication is configured.</div>}
    {configured === null && <div className="auth-setup" role="status">{serviceError || "Checking account services…"}{serviceError && onRetry && <button className="auth-back" type="button" onClick={() => { void onRetry(); }}>Retry connection</button>}</div>}
    {mode !== "reset" && <div className="auth-modes" role="group" aria-label="Account access"><button type="button" aria-pressed={mode === "login"} className={mode === "login" ? "active" : ""} disabled={busy} onClick={() => switchMode("login")}>Login</button><button type="button" aria-pressed={mode === "signup"} className={mode === "signup" ? "active" : ""} disabled={busy} onClick={() => switchMode("signup")}>Create Account</button></div>}
    <form noValidate onSubmit={submit} aria-busy={busy}><fieldset disabled={busy} className="auth-fields">
      {mode === "signup" && <>{field("fullName", "Full Name", "name")}{field("mobile", "Mobile Number", "tel", "tel")}</>}
      {mode !== "reset" && field("email", "Email Address", "email", "email")}
      {mode !== "forgot" && field("password", mode === "reset" ? "New Password" : "Password", mode === "login" ? "current-password" : "new-password")}
      {(mode === "signup" || mode === "reset") && <><span id="password-help" className="password-help">Use 12–128 characters. A unique passphrase is a good choice.</span>{field("confirmPassword", "Confirm Password", "new-password")}</>}
      {mode === "signup" && <div className="auth-field"><label htmlFor="auth-accountType">Account type</label><select id="auth-accountType" name="accountType" value={fields.accountType} onChange={e => change("accountType", e.target.value)} aria-invalid={!!errors.accountType} aria-describedby={errors.accountType ? "error-accountType" : undefined}>{accountTypes.map(type => <option key={type}>{type}</option>)}</select>{errors.accountType && <span className="field-error" id="error-accountType">{errors.accountType}</span>}</div>}
      {mode === "login" && <div className="auth-options"><label><input type="checkbox" checked={fields.remember} onChange={e => change("remember", e.target.checked)} />Remember me</label><button type="button" onClick={() => switchMode("forgot")}>Forgot Password?</button></div>}
    </fieldset>
    {message && <div className={success ? "auth-message success" : "auth-message"} role={success ? "status" : "alert"}>{message}</div>}
    <button className="primary auth-submit" type="submit" disabled={busy || configured === null}>{busy ? "Please wait…" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update Password" : "Login"}</button></form>
    {mode === "forgot" && <button className="auth-back" onClick={() => switchMode("login")} disabled={busy}>Back to Login</button>}
    {mode === "reset" && <Link className="auth-back" href="/">Return to ApnaProperty</Link>}
    <p className="auth-footnote">{mode === "signup" ? "Email confirmation is required. Your mobile number is collected as contact information and is not verified in this phase." : "Use a private device when choosing Remember me."}</p>
  </div>;
}
