import "server-only";
import { cookies } from "next/headers";
import { firebaseAuth, firebaseDb } from "../firebase/admin";
import { accountTypes, type AccountType, type AuthUser } from "./validation";

export function authConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.FIREBASE_API_KEY;
  const appUrl = process.env.APP_URL;
  if (!projectId || !apiKey || !appUrl) return null;
  try {
    const app = new URL(appUrl);
    if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId) || !["http:", "https:"].includes(app.protocol) || app.pathname !== "/" || app.search || app.hash || app.username || app.password) return null;
    if (app.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(app.hostname)) return null;
    return { projectId, apiKey, origin: app.origin };
  } catch { return null; }
}
export class IdentityError extends Error {
  constructor(readonly code: string) { super("Firebase identity request failed."); }
}
// Tokens and passwords never leave the server response boundary or enter logs/storage.
export async function identityRequest<T>(operation: string, body: object): Promise<T> {
  const config = authConfig();
  if (!config) throw new Error("Authentication is not configured.");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${operation}?key=${encodeURIComponent(config.apiKey)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new IdentityError(typeof data.error?.message === "string" ? data.error.message.split(" : ")[0] : "UNAVAILABLE");
  return data as T;
}
export async function sessionIdentity() {
  const token = (await cookies()).get("apna-session")?.value;
  if (!token) return null;
  try {
    const decoded = await firebaseAuth().verifySessionCookie(token, true);
    const user = await firebaseAuth().getUser(decoded.uid);
    return user.emailVerified && !user.disabled ? user : null;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (["auth/session-cookie-expired", "auth/session-cookie-revoked", "auth/argument-error", "auth/invalid-session-cookie", "auth/user-not-found", "auth/user-disabled"].includes(code)) return null;
    throw error;
  }
}
export async function publicUser(uid: string): Promise<AuthUser> {
  const [identity, profile] = await Promise.all([firebaseAuth().getUser(uid), firebaseDb().doc(`users/${uid}`).get()]);
  const data = profile.data() ?? {};
  return { id: uid, email: identity.email ?? "", name: typeof data.fullName === "string" ? data.fullName.slice(0, 100) : identity.displayName ?? "Your account", mobile: typeof data.mobile === "string" ? data.mobile : "", accountType: accountTypes.includes(data.accountType as AccountType) ? data.accountType : "Buyer" };
}
export async function createSession(idToken: string, remember: boolean) {
  const config = authConfig();
  if (!config) throw new Error("Authentication is not configured.");
  const decoded = await firebaseAuth().verifyIdToken(idToken, true);
  if (!decoded.email_verified || Math.abs(Date.now() / 1000 - decoded.auth_time) > 300) throw new Error("A recent verified sign-in is required.");
  const duration = 60 * 60 * 24 * (remember ? 14 : 1);
  const token = await firebaseAuth().createSessionCookie(idToken, { expiresIn: duration * 1000 });
  (await cookies()).set("apna-session", token, { httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "lax", path: "/", ...(remember ? { maxAge: duration } : {}) });
}
export async function clearAuthCookies() { (await cookies()).delete("apna-session"); }
