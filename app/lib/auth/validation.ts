export const accountTypes = ["Buyer", "Tenant", "Property Owner", "Agent"] as const;
export type AccountType = typeof accountTypes[number];
export type AuthMode = "login" | "signup" | "forgot" | "reset";
export type AuthFields = { fullName: string; mobile: string; email: string; password: string; confirmPassword: string; accountType: string; remember: boolean };
export type FieldErrors = Partial<Record<keyof AuthFields, string>>;
export type AuthUser = { id: string; name: string; email: string; mobile: string; accountType: string };
export const blankAuthFields: AuthFields = { fullName: "", mobile: "", email: "", password: "", confirmPassword: "", accountType: "Buyer", remember: false };
export function normalizeMobile(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  const digits = compact.startsWith("+91") ? compact.slice(3) : compact;
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}
export function validateAuth(fields: AuthFields, mode: AuthMode): FieldErrors {
  const errors: FieldErrors = {};
  if (mode !== "reset" && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()) || fields.email.length > 254)) errors.email = "Enter a valid email address.";
  if (mode === "login" && (!fields.password || fields.password.length > 128)) errors.password = "Enter your password (maximum 128 characters).";
  if (mode === "signup" || mode === "reset") {
    if (!fields.password.trim() || fields.password.length < 12 || fields.password.length > 128) errors.password = "Use 12–128 characters for your password.";
    if (fields.confirmPassword !== fields.password || !fields.confirmPassword) errors.confirmPassword = "Passwords must match.";
  }
  if (mode === "signup") {
    if (fields.fullName.trim().length < 2 || fields.fullName.trim().length > 100) errors.fullName = "Enter your full name (2–100 characters).";
    if (!normalizeMobile(fields.mobile)) errors.mobile = "Enter a valid 10-digit Indian mobile number, optionally with +91.";
    if (!accountTypes.includes(fields.accountType as AccountType)) errors.accountType = "Choose a valid account type.";
  }
  return errors;
}
export function parseAuthFields(input: unknown): AuthFields {
  const data = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const str = (name: string) => typeof data[name] === "string" ? data[name] as string : "";
  return { fullName: str("fullName"), mobile: str("mobile"), email: str("email"), password: str("password"), confirmPassword: str("confirmPassword"), accountType: str("accountType"), remember: data.remember === true };
}
