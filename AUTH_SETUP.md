# ApnaProperty authentication setup

The active authentication provider is now Firebase, replacing the unconfigured
Supabase foundation. The existing premium forms, validation, header profile UI,
and marketplace remain intact. Existing environment files are never overwritten.
Supabase credentials, if independently configured previously, are not migrated;
Firebase is a separate identity system. No real users were imported or deleted.

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for project selection, exact console
steps, environment variables, server identity, email templates and deployment.

## Authentication flow

- Email/password signup uses Firebase's official Identity Toolkit REST API.
  Firebase hashes/stores passwords; the app does not store passwords.
- The Admin SDK verifies the resulting token belongs to the configured project.
  It creates a private `users/{uid}` Firestore profile and sends confirmation mail.
  A profile-write failure attempts to delete the newly created identity.
- Login verifies the provider ID token, user status and email confirmation before
  issuing a Firebase session cookie. Unconfirmed users get another confirmation
  email after a valid password login, rather than access to a verified session.
- Cookies are HttpOnly, SameSite=Lax, Secure under HTTPS, and scoped to `/`.
  Remember Me lasts 14 days; otherwise the browser session cookie has a server
  expiry of one day. Sessions have fixed expiry; users log in again afterwards.
- Each session lookup checks revocation and current identity status. Password
  changes invalidate previous sessions through Firebase's revocation mechanism.
- Logout clears the current browser session cookie; it does not log out other
  devices. A stolen copied cookie requires administrator revocation; a future
  "log out all devices" feature can explicitly revoke refresh tokens.
- Forgot Password sends Firebase reset mail and returns a generic message.
  A reset requires the single-use `oobCode`, validates the new password and
  updates it through Firebase. Confirmation/reset codes stay in memory and are
  removed from visible browser history. Configure server access-log redaction
  for action URLs before launch; initial link requests can contain the code.
- `/auth/action` handles the email action link. It ignores arbitrary `continueUrl`,
  `apiKey` and redirect destinations from incoming links. Email confirmation is
  an explicit same-origin POST. Legacy `/auth/callback` fails closed.

No access/refresh tokens, provider credentials or passwords are returned to
browser JavaScript or persisted in localStorage. Passwords exist temporarily in
form memory and HTTPS requests. Requests are bounded at 8 KiB, validated on both
client/server, protected by strict Origin checks, and return no-store responses.
Profile account type is a preference, not an authorization role. Mobile numbers
are collected but NOT OTP-verified. All protected server operations must verify
identity; the header and client state are not permission boundaries.

## Before enabling public authentication

Enable Firebase email/password authentication, minimum 12-character policy and
email enumeration protection. Configure authorized domains and email action
templates. Configure durable per-client edge rate limiting for `/api/auth/*`;
provider quotas alone are inadequate for a shared server proxy. This phase does
not pretend an in-memory limiter is production protection. If enabling CAPTCHA
or App Check enforcement, add its challenge/token integration before launch.
Review email branding/deliverability, IAM, privacy policy and monitoring.

Until real configuration is supplied, handlers fail closed and the UI says
account services are not enabled. No fake production session is provided.

## Verification

`npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:auth`,
`npm run test:search` and `npm run test:audit` verify the prepared frontend and
fail-closed API behavior. Browser session fixtures exist only in tests.
Live signup, Firestore profile creation, confirmation mail, login, session
persistence, logout, recovery and revocation must be verified after setup.

References: [Firebase Auth REST API](https://firebase.google.com/docs/reference/rest/auth),
[Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies),
[Admin SDK setup](https://firebase.google.com/docs/admin/setup).
