import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { authConfig, clearAuthCookies, createSession, identityRequest, IdentityError, publicUser, sessionIdentity } from "../../../lib/auth/server";
import { firebaseAuth, firebaseDb } from "../../../lib/firebase/admin";
import { normalizeMobile, parseAuthFields, validateAuth, type AuthMode } from "../../../lib/auth/validation";

export const runtime = "nodejs";
function reply(body: object, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } }); }
export async function GET(_request: NextRequest, context: { params: Promise<{ action: string }> }) {
  if ((await context.params).action !== "session") return reply({ message: "Not found." }, 404);
  if (!authConfig()) return reply({ configured: false, user: null });
  try {
    const user = await sessionIdentity();
    return reply({ configured: true, user: user ? await publicUser(user.uid) : null });
  } catch { return reply({ message: "Unable to check your session. Please try again." }, 503); }
}
export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const action = (await context.params).action;
  if (!["login", "signup", "forgot", "reset", "logout", "verify"].includes(action)) return reply({ message: "Not found." }, 404);
  const config = authConfig();
  const origin = config?.origin ?? new URL(request.url).origin;
  if (request.headers.get("origin") !== origin || request.headers.get("sec-fetch-site") === "cross-site") return reply({ message: "Request origin is not allowed." }, 403);
  if (!config) return reply({ message: "Authentication is not configured yet. Please try again after account services are enabled." }, 503);
  try {
    if (action === "logout") { await clearAuthCookies(); return reply({ user: null }); }
    if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ message: "Expected a JSON request." }, 415);
    const reader = request.body?.getReader(); const decoder = new TextDecoder(); let raw = ""; let size = 0;
    if (reader) {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 8192) { await reader.cancel(); return reply({ message: "Request is too large." }, 413); }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    }
    let input: unknown;
    try { input = JSON.parse(raw); } catch { return reply({ message: "Invalid request." }, 400); }
    const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
    const oobCode = typeof data.oobCode === "string" && /^[A-Za-z0-9_-]{10,2048}$/.test(data.oobCode) ? data.oobCode : null;
    if (action === "verify") {
      if (!oobCode) return reply({ message: "Your confirmation link is invalid. Request a new email by logging in." }, 400);
      await identityRequest("update", { oobCode });
      return reply({ message: "Your email is confirmed. You can now log in." });
    }
    const fields = parseAuthFields(input);
    const errors = validateAuth(fields, action as AuthMode);
    if (Object.keys(errors).length) return reply({ errors, message: "Please check the highlighted fields." }, 400);
    const email = fields.email.trim().toLowerCase();
    if (action === "login") {
      const result = await identityRequest<{ idToken: string; localId: string }>("signInWithPassword", { email, password: fields.password, returnSecureToken: true });
      const decoded = await firebaseAuth().verifyIdToken(result.idToken, true);
      const user = await firebaseAuth().getUser(decoded.uid);
      if (!user.emailVerified) {
        await identityRequest("sendOobCode", { requestType: "VERIFY_EMAIL", idToken: result.idToken, continueUrl: `${config.origin}/` });
        return reply({ message: "Confirm your email before logging in. A new confirmation email has been requested." }, 401);
      }
      const profile = await publicUser(decoded.uid);
      await createSession(result.idToken, fields.remember);
      return reply({ user: profile });
    }
    if (action === "signup") {
      // Fail before creating an identity if local ADC/IAM or Firestore is missing.
      await Promise.all([firebaseAuth().listUsers(1), firebaseDb().collection("users").limit(1).get()]);
      const result = await identityRequest<{ idToken: string; localId: string }>("signUp", { email, password: fields.password, returnSecureToken: true });
      const decoded = await firebaseAuth().verifyIdToken(result.idToken, true);
      try {
        await firebaseAuth().updateUser(decoded.uid, { displayName: fields.fullName.trim() });
        await firebaseDb().doc(`users/${decoded.uid}`).create({ fullName: fields.fullName.trim(), mobile: normalizeMobile(fields.mobile), accountType: fields.accountType, mobileVerified: false, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      } catch (error) {
        await firebaseAuth().deleteUser(decoded.uid);
        throw error;
      }
      await identityRequest("sendOobCode", { requestType: "VERIFY_EMAIL", idToken: result.idToken, continueUrl: `${config.origin}/` });
      return reply({ message: "If registration is available for this email, check your inbox to confirm your account, then log in." });
    }
    if (action === "forgot") {
      try { await identityRequest("sendOobCode", { requestType: "PASSWORD_RESET", email, continueUrl: `${config.origin}/` }); }
      catch (error) { if (!(error instanceof IdentityError) || error.code !== "EMAIL_NOT_FOUND") throw error; }
      return reply({ message: "If an account exists for this email, you will receive a password-reset link." });
    }
    if (!oobCode) return reply({ message: "Your reset link is invalid or expired. Request a new reset email." }, 400);
    await identityRequest("resetPassword", { oobCode, newPassword: fields.password });
    await clearAuthCookies();
    return reply({ message: "Your password has been updated. Log in with your new password." });
  } catch (error) {
    if (error instanceof IdentityError) {
      if (error.code === "TOO_MANY_ATTEMPTS_TRY_LATER") return reply({ message: "Too many attempts. Please wait and try again." }, 429);
      if (action === "login") return reply({ message: "Unable to log in. Check your email and password, and confirm your email if required." }, 401);
      if (action === "signup" && error.code === "EMAIL_EXISTS") return reply({ message: "If registration is available for this email, check your inbox to confirm your account, then log in." });
      if (["INVALID_OOB_CODE", "EXPIRED_OOB_CODE"].includes(error.code)) return reply({ message: "This account link is invalid or expired. Request a new email." }, 400);
    }
    return reply({ message: "Account services are temporarily unavailable. Please try again." }, 503);
  }
}
