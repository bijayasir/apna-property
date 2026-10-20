import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

// Contract tests execute the actual TS server modules with isolated provider
// adapters. No fixture identity or authentication fallback ships in the app.
const nativeRequire = createRequire(import.meta.url);
function load(path, mocks) {
  const output = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const compiled = { exports: {} };
  new Function("require", "module", "exports", output)(name => name in mocks ? mocks[name] : nativeRequire(name), compiled, compiled.exports);
  return compiled.exports;
}
const validation = load("app/lib/auth/validation.ts", {});
const changes = [];
let cookie = "fixture-cookie";
let verified = true;
let tokenRevoked = false;
const identity = { uid: "test-user", email: "buyer@example.test", emailVerified: true, disabled: false };
const admin = {
  verifySessionCookie: async (value, revocation) => { assert.equal(value, cookie); assert.equal(revocation, true); if (tokenRevoked) throw { code: "auth/session-cookie-revoked" }; return { uid: identity.uid }; },
  getUser: async () => ({ ...identity, emailVerified: verified }),
  verifyIdToken: async () => ({ uid: identity.uid, email_verified: verified, auth_time: Date.now() / 1000 }),
  createSessionCookie: async (token, options) => { assert.equal(token, "fixture-id-token"); changes.push(options); return "fixture-session"; },
};
const server = load("app/lib/auth/server.ts", {
  "server-only": {},
  "next/headers": { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined, set: (...args) => changes.push(args), delete: name => changes.push({ deleted: name }) }) },
  "../firebase/admin": { firebaseAuth: () => admin, firebaseDb: () => ({ doc: () => ({ get: async () => ({ data: () => ({ fullName: "Test Buyer", mobile: "+919876543210", accountType: "admin" }) }) }) }) },
  "./validation": validation,
});
process.env.FIREBASE_PROJECT_ID = "isolated-test-project";
process.env.FIREBASE_API_KEY = "isolated-contract-key-not-a-credential";
process.env.APP_URL = "https://apna.example.test";
assert.equal(server.authConfig().origin, "https://apna.example.test");
process.env.APP_URL = "https://apna.example.test/unsafe";
assert.equal(server.authConfig(), null);
process.env.APP_URL = "https://apna.example.test";
await server.createSession("fixture-id-token", true);
assert.equal(changes[0].expiresIn, 14 * 86400 * 1000);
assert.equal(changes[1][2].httpOnly, true); assert.equal(changes[1][2].secure, true);
assert.equal(changes[1][2].sameSite, "lax"); assert.equal(changes[1][2].maxAge, 14 * 86400);
changes.length = 0;
await server.createSession("fixture-id-token", false);
assert.equal(changes[0].expiresIn, 86400 * 1000);
assert.equal(changes[1][2].maxAge, undefined);
verified = false;
await assert.rejects(server.createSession("fixture-id-token", true));
assert.equal(await server.sessionIdentity(), null);
verified = true; tokenRevoked = true;
assert.equal(await server.sessionIdentity(), null);
tokenRevoked = false; cookie = "";
assert.equal(await server.sessionIdentity(), null);
assert.equal((await server.publicUser(identity.uid)).accountType, "Buyer");

const operations = [];
let failProfile = false;
let adminReady = true;
const profileAdmin = {
  listUsers: async () => { if (!adminReady) throw new Error("Missing ADC"); },
  verifyIdToken: async () => ({ uid: identity.uid }),
  getUser: async () => ({ ...identity, emailVerified: verified }),
  updateUser: async () => {},
  deleteUser: async uid => operations.push(["deleteUser", uid]),
};
const route = load("app/api/auth/[action]/route.ts", {
  "firebase-admin/firestore": { FieldValue: { serverTimestamp: () => "fixture-server-time" } },
  "../../../lib/auth/validation": validation,
  "../../../lib/auth/server": { ...server, sessionIdentity: async () => null, createSession: async (...args) => operations.push(["session", ...args]), publicUser: async () => ({ id: identity.uid }), identityRequest: async (action, body) => { operations.push([action, body]); return { idToken: "fixture-id-token", localId: identity.uid }; }, clearAuthCookies: async () => operations.push(["clear-cookie"]) },
  "../../../lib/firebase/admin": { firebaseAuth: () => profileAdmin, firebaseDb: () => ({ collection: () => ({ limit: () => ({ get: async () => {} }) }), doc: () => ({ create: async data => { if (failProfile) throw new Error("Denied profile"); operations.push(["profile", data]); } }) }) },
});
const { NextRequest } = nativeRequire("next/server");
async function post(action, data, origin = "https://apna.example.test") {
  return route.POST(new NextRequest(`https://apna.example.test/api/auth/${action}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(data) }), { params: Promise.resolve({ action }) });
}
const fields = { ...validation.blankAuthFields, fullName: "Test Buyer", mobile: "9876543210", email: "buyer@example.test", password: "Unique test passphrase!", confirmPassword: "Unique test passphrase!", accountType: "Agent", remember: true };
assert.equal((await post("login", fields, "https://bad.example.test")).status, 403);
assert.equal(operations.length, 0);
assert.equal((await post("reset", fields)).status, 400);
assert.equal(operations.length, 0);
assert.equal((await post("reset", { ...fields, oobCode: "isolated-reset-code-1234" })).status, 200);
assert.equal(operations[0][0], "resetPassword"); assert.equal(operations[0][1].newPassword, fields.password);
assert.equal(operations[1][0], "clear-cookie");
operations.length = 0;
assert.equal((await post("signup", fields)).status, 200);
assert.equal(operations[1][0], "profile"); assert.equal(operations[1][1].mobile, "+919876543210");
assert.equal(operations[1][1].accountType, "Agent");
assert.ok(!("password" in operations[1][1]));
assert.equal(operations[2][1].requestType, "VERIFY_EMAIL");
assert.equal(operations.some(operation => operation[0] === "session"), false);
operations.length = 0; failProfile = true;
assert.equal((await post("signup", fields)).status, 503);
assert.deepEqual(operations[1], ["deleteUser", identity.uid]);
failProfile = false; operations.length = 0; adminReady = false;
assert.equal((await post("signup", fields)).status, 503);
assert.equal(operations.length, 0);
adminReady = true; verified = false;
assert.equal((await post("login", fields)).status, 401);
assert.equal(operations.some(operation => operation[0] === "session"), false);
operations.length = 0; verified = true;
const login = await post("login", fields);
assert.equal(login.status, 200); assert.deepEqual(await login.json(), { user: { id: identity.uid } });
assert.deepEqual(operations[1], ["session", "fixture-id-token", true]);
operations.length = 0;
assert.equal((await post("verify", { oobCode: "isolated-verification-code-1234" })).status, 200);
assert.deepEqual(operations[0], ["update", { oobCode: "isolated-verification-code-1234" }]);
assert.equal((await post("verify", { oobCode: "short" })).status, 400);
console.log("Passed Firebase server contracts: secure session duration/cookies, unverified/revoked identity, CSRF, single-use recovery, profile creation/rollback, Admin readiness and confirmation.");
