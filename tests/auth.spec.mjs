import { test, expect } from "@playwright/test";

async function openAuth(page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Login / Sign Up", exact: true }).click();
  return page.getByRole("dialog");
}
test("login validates email/password, toggles visibility and exposes remember/recovery", async ({ page }) => {
  const dialog = await openAuth(page);
  await dialog.getByRole("button", { name: "Login", exact: true }).last().click();
  await expect(dialog).toContainText("Enter a valid email address.");
  await expect(dialog).toContainText("Enter your password");
  await dialog.getByLabel("Email Address", { exact: true }).fill("buyer@example.test");
  await dialog.getByLabel("Password", { exact: true }).fill("Long test passphrase!");
  await dialog.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(dialog.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await dialog.getByRole("button", { name: "Hide password", exact: true }).click();
  await expect(dialog.getByLabel("Password", { exact: true })).toHaveAttribute("type", "password");
  await dialog.getByLabel("Remember me").check();
  await expect(dialog.getByLabel("Remember me")).toBeChecked();
  await dialog.getByRole("button", { name: "Forgot Password?" }).click();
  await expect(dialog.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await dialog.getByRole("button", { name: "Send reset link" }).click();
  await expect(dialog).toContainText("Enter a valid email address.");
  await dialog.getByRole("button", { name: "Back to Login" }).click();
  await expect(dialog.getByLabel("Password", { exact: true })).toHaveValue("");
});
test("signup fields validate and disabled integration never invents an account", async ({ page }) => {
  const sent = [];
  page.on("request", request => { if (request.method() === "POST" && request.url().includes("/api/auth/")) sent.push(request.url()); });
  const dialog = await openAuth(page);
  await expect(dialog).toContainText("Account services are not enabled yet");
  await dialog.getByRole("button", { name: "Create Account", exact: true }).first().click();
  await dialog.getByRole("button", { name: "Create Account", exact: true }).last().click();
  await expect(dialog).toContainText("Enter your full name");
  await expect(dialog).toContainText("Indian mobile number");
  await expect(dialog).toContainText("Passwords must match");
  await dialog.getByLabel("Full Name", { exact: true }).fill("Test Buyer");
  await dialog.getByLabel("Mobile Number", { exact: true }).fill("+91 98765 43210");
  await dialog.getByLabel("Email Address", { exact: true }).fill("buyer@example.test");
  await dialog.getByLabel("Password", { exact: true }).fill("Test passphrase 2026!");
  await dialog.getByLabel("Confirm Password", { exact: true }).fill("Different password!");
  await dialog.getByRole("button", { name: "Create Account", exact: true }).last().click();
  await expect(dialog).toContainText("Passwords must match.");
  await dialog.getByLabel("Confirm Password", { exact: true }).fill("Test passphrase 2026!");
  for (const type of ["Buyer", "Tenant", "Property Owner", "Agent"]) await dialog.getByLabel("Account type", { exact: true }).selectOption(type);
  await dialog.getByRole("button", { name: "Create Account", exact: true }).last().click();
  await expect(dialog.getByRole("alert")).toContainText("Authentication is not configured yet");
  expect(sent).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Login / Sign Up", exact: true }).click();
  await expect(page.getByRole("dialog").getByLabel("Password", { exact: true })).toHaveValue("");
});
test("server fails closed without configuration and rejects cross-origin mutations", async ({ request }) => {
  const session = await request.get("/api/auth/session");
  expect(await session.json()).toEqual({ configured: false, user: null });
  expect(session.headers()["cache-control"]).toContain("no-store");
  for (const action of ["login", "signup", "forgot", "reset", "logout", "verify"]) {
    const forbidden = await request.post(`/api/auth/${action}`, { headers: { Origin: "https://untrusted.example" }, data: {} });
    expect(forbidden.status()).toBe(403);
    const disabled = await request.post(`/api/auth/${action}`, { headers: { Origin: "http://localhost:3100" }, data: {} });
    expect(disabled.status()).toBe(503);
    expect(disabled.headers()["set-cookie"]).toBeUndefined();
  }
  const callback = await request.get("/auth/callback?code=invalid&next=https://untrusted.example", { maxRedirects: 0 });
  expect(callback.headers().location).toBe("http://localhost:3100/?auth=link-error");
});

test("Firebase email actions reject unsafe links and preserve one-time reset codes only in memory", async ({ page, request }) => {
  const headers = await request.get("/auth/action");
  expect(headers.headers()["referrer-policy"]).toBe("no-referrer");
  await page.goto("/auth/action?mode=verifyEmail&oobCode=short&continueUrl=https://untrusted.example");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("link is invalid");
  await expect(page.getByRole("button", { name: "Confirm email" })).toHaveCount(0);

  await page.goto("/auth/action?mode=resetPassword&oobCode=isolated-test-code-123456&continueUrl=https://untrusted.example");
  await expect(page.getByRole("button", { name: "Update Password" })).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe("");
  expect(new URL(page.url()).origin).toBe("http://localhost:3100");
  await page.getByLabel("New Password", { exact: true }).fill("A unique test passphrase!");
  await page.getByLabel("Confirm Password", { exact: true }).fill("A unique test passphrase!");
  await page.getByRole("button", { name: "Update Password" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Authentication is not configured yet");

  await page.goto("/auth/action?mode=verifyEmail&oobCode=isolated-test-code-123456&apiKey=ignored&continueUrl=https://untrusted.example");
  await expect(page.getByRole("button", { name: "Confirm email" })).toBeVisible();
  await expect.poll(() => new URL(page.url()).search).toBe("");
  await page.getByRole("button", { name: "Confirm email" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Authentication is not configured yet");
});
test("temporary session service failure offers retry without inventing a session", async ({ page }) => {
  let unavailable = true;
  await page.route("**/api/auth/session", route => route.fulfill({ status: unavailable ? 503 : 200, json: unavailable ? { message: "Unavailable" } : { configured: false, user: null } }));
  const dialog = await openAuth(page);
  await expect(dialog).toContainText("Account services are temporarily unavailable");
  unavailable = false;
  await dialog.getByRole("button", { name: "Retry connection" }).click();
  await expect(dialog).toContainText("Account services are not enabled yet");
});
test("profile and logout UI consume session API without storing passwords or tokens", async ({ page }) => {
  // Isolated API contract fixture only: production code never contains this user or fake sessions.
  const user = { id: "test-fixture", name: "Test Buyer", email: "buyer@example.test", mobile: "+919876543210", accountType: "Buyer" };
  await page.route("**/api/auth/session", route => route.fulfill({ json: { configured: true, user } }));
  await page.route("**/api/auth/logout", route => route.fulfill({ json: { user: null } }));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Account / Profile" }).click();
  await expect(page.getByRole("dialog")).toContainText("buyer@example.test");
  await expect(page.getByRole("dialog")).toContainText("Not verified");
  await page.getByRole("dialog").getByRole("button", { name: "Logout", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Login / Sign Up", exact: true })).toBeVisible();
});
for (const width of [320, 768, 1440]) {
  test(`authentication fits ${width}px and recovery page remains safe`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const dialog = await openAuth(page);
    await dialog.getByRole("button", { name: "Create Account", exact: true }).first().click();
    const bounds = await dialog.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await dialog.getByLabel("Confirm Password", { exact: true }).fill("test");
    await page.screenshot({ path: `test-results/auth-${width}.png` });
    await page.keyboard.press("Escape");
    await page.goto("/auth/reset-password", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Update Password" }).click();
    await expect(page.getByText("Use 12–128 characters for your password.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
