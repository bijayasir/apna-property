# ApnaProperty Firebase preparation and safe deployment

## Current state and deployment method

This is the existing Next.js 16.3.8 App Router app, React 19, TypeScript and
server Route Handlers. Use **Firebase App Hosting**, not static export or the
older experimental Firebase Hosting framework integration. The project-local
Firebase CLI is available with `npm exec -- firebase ...` (Windows: `npm.cmd`).
No project alias, backend ID, region, billing account or production origin is
selected. No `.firebaserc` is generated until the owner confirms the project.

Firebase's published support schedule currently lists Next.js 15.2 as active
and newer releases as preview. Preserve 16.3.8; validate its App Hosting cloud
build after project approval. A local successful Next build is not proof of
adapter compatibility. Do not downgrade or switch deployment methods silently.
Use an approved versioned Node.js 22 runtime (or compatible Node.js 24).

## Exact first step: authorize the CLI

From PowerShell in `D:\apna-property`:

```powershell
npm.cmd exec -- firebase login
```

In the opened browser, select the Google account owning/managing the intended
Firebase project and approve the Firebase CLI authorization. Optional telemetry
choices are yours. Do not paste the authorization code or token into chat.
When it finishes, tell the agent login is complete. The agent can then run the
read-only `firebase projects:list`, show available IDs/names and ask you which
exact project to use **before** linking, creating a backend or deploying.
CLI authorization alone is not permission to choose a project.

## After confirming a project

1. In [Firebase Console](https://console.firebase.google.com/), open the confirmed
   project. If none exists, create one yourself and confirm its exact project ID.
2. App Hosting requires the **Blaze** billing plan. You must select the billing
   account and approve costs. Configure billing alerts; maxInstances is not a
   spending cap. Do not let an agent select your billing account silently.
3. Project Settings > General > Your apps > Web: register/select a Web app.
   Copy its `projectId`, `apiKey`, and actual `storageBucket` to `.env.local`,
   using [.env.example](.env.example). Never overwrite an existing `.env.local`.
   Set `APP_URL` to the exact origin, e.g. your approved HTTPS production URL,
   with no path. Restart the server after changing values. No fake values work.
4. Build > Authentication > Get started > Sign-in method: enable Email/Password
   (not passwordless email-link login). Under Settings, enable email enumeration
   protection and a minimum 12-character password policy.
5. Authentication > Settings > Authorized domains: add your actual production
   hostname. Add `localhost` for development if absent. Review API key API
   restrictions for Identity Toolkit; browser referrer restrictions do not work
   for this server-side REST client. The API key is not a privileged Admin key.
6. Authentication > Templates: customize the action URL for Email verification
   and Password reset to `https://YOUR_CONFIRMED_HOST/auth/action` (use your
   localhost origin when testing locally). Firebase supplies mode/oobCode. Keep
   sender branding appropriate and verify mail deliverability. The standard
   Firebase-hosted action handler also works if custom URLs are not configured.
7. Build > Firestore Database: create the **default Standard database**, choose
   production mode and personally approve its permanent location. Profile
   creation needs this database; absent database/IAM prevents signup.
8. Build > Storage: provision the bucket, personally confirm its location/billing
   requirements, and copy the actual bucket name. Do not derive or guess it.

## Server credentials and IAM

The app uses `firebase-admin` only on the server, with Application Default
Credentials. In App Hosting use the backend runtime service identity; do not
upload a private-key JSON file or set GOOGLE_APPLICATION_CREDENTIALS there.
Verify the selected runtime identity has the minimum required Auth permissions
for user management/session creation (Firebase Authentication Admin), Firestore
data access (Cloud Datastore User), and, only when uploads are enabled, object
access for the intended bucket. Do not grant project Owner to the app runtime.

For local live Auth testing, prefer approved service-account ADC impersonation
through Google Cloud tooling. An alternative is a service-account key file kept
outside this repo, with `GOOGLE_APPLICATION_CREDENTIALS` pointing to its path.
Never send that key in chat or commit it. Plain `firebase login` does not configure
Admin SDK ADC; ordinary `gcloud auth application-default login` end-user
credentials are not sufficient for Firebase Auth without the additional setup
described in the [official Admin guide](https://firebase.google.com/docs/admin/setup).

## Linking and deployment: approval required

Only after the project ID, billing, backend and region have been confirmed:

```powershell
npm.cmd exec -- firebase init apphosting --project CONFIRMED_PROJECT_ID
```

Select the confirmed existing project and approved backend (or explicitly
approve creating a backend). App root is `.`, runtime Node.js 22. Preserve
existing `firebase.json` rules/indexes and `apphosting.yaml` settings if prompted.
Initialization adds the real `apphosting` backend mapping to `firebase.json`;
it is intentionally absent from the prepared file to prevent accidental linking.
Select deployment-source exclusions that protect `.env*`, local credentials,
`.firebase`, logs and test artifacts. `.gitignore` already excludes these.

In App Hosting > View Backend > Settings > Environment, configure the four
variables from `.env.example` for the approved project/origin. APP_URL must
match the backend's actual production origin before enabling account services.
These are server runtime values; no browser NEXT_PUBLIC credentials are needed.
Sensitive additional values belong in Cloud Secret Manager references, not
committed `apphosting.yaml`. Do not copy local credential-file paths to hosting.

Deploy rules/indexes only after checking whether the chosen project already
contains applications, data or rules. The supplied rules deny client writes;
deploying them blindly over an existing project's policies can break other apps.
Review current policies and agree on the change first:

```powershell
npm.cmd exec -- firebase deploy --only firestore:rules,firestore:indexes,storage --project CONFIRMED_PROJECT_ID
npm.cmd exec -- firebase deploy --only apphosting:CONFIRMED_BACKEND_ID --project CONFIRMED_PROJECT_ID
```

These are instructions, not commands already executed. Deployment must use an
explicit approved project and a single backend. No generic `firebase deploy`.
After rollout, obtain the real URL from Firebase, verify HTTPS, homepage, search,
cards, favourites, detail modal, console/image loads and real Auth flows. Report
a URL only after a successful deployment; none exists for this preparation.

## Firestore architecture

| Collection/path | Data and protection |
| --- | --- |
| `users/{uid}` | Private name/mobile/accountType/timestamps. Firebase Auth holds email/password identity. No password or token fields. Self read only; server writes. |
| `users/{uid}/favourites/{propertyId}` | Property ID/timestamp. Verified owner only. Server repository checks the listing is published. |
| `properties/{propertyId}` | Public-safe title/city/locality/INR price/purpose/category/bedrooms/area/description/image paths/ownerId/status/verified/timestamps. Only published records public; drafts private to owner. Server controls publication and verification. |
| `ownerAgents/{uid}` | Private owner/agent information and verification status. Self read; server/moderator writes. Account type is not proof of agent/owner authority. |
| `enquiries/{id}` | Property/sender/recipient/message/status/timestamps. Participants only; validate recipient against listing owner on future creation. |

All documents use server-created `createdAt`/`updatedAt` timestamps where
applicable. No public listing may contain private email/mobile/verification
documents. Admin SDK bypasses Security Rules, so every future server mutation
must authorize identity/ownership and validate input separately.

`firestore.rules`, `firestore.indexes.json`, typed models and a server repository
are prepared. Signup writes the user profile once credentials/IAM are configured.
The existing 22 sample listings and session favourites are intentionally retained;
listing migration, pagination/filter query design, account-backed favourites UI,
posting, owner verification and enquiries endpoints are a future integration.
No sample records are automatically uploaded and no destructive migration runs.

## Storage architecture

`property-uploads/{uid}/{propertyId}/{uuid}.jpg|png|webp` is private staging.
The server helper checks verified identity, listing ownership, draft/pending
status, supported content type and 5 MiB size limit. It does not expose an upload
endpoint. Future routes must also decode/re-encode actual bytes, limit per-user
quotas, moderate images and avoid trusting the browser's MIME header.
Only moderation may promote sanitized assets to
`published-property-images/{propertyId}/{imageId}`, which permits public reads.
Client writes to either prefix are denied. Signed URLs bypass Storage Rules:
do not issue public/signed access to unapproved staged images. Existing Unsplash
images remain unchanged until real property image integration is ready.

## Launch gates and tests

Configure durable per-client edge rate limits for auth routes before public
signup; provider rate quotas alone do not protect a shared server proxy.
CAPTCHA/App Check challenge integration, if enforced, remains a separate task.
Redact action codes in hosting/access logs. Review privacy/terms and mail branding.
Security Rules should be compiled/tested with the Firebase emulators before
first rules deployment; no live project rules are modified during preparation.
The Firestore/Storage emulators need Java 21+; Java is not installed on this
computer, so rules emulator verification remains a launch gate. Do not describe
the rules as deployed or emulator-tested merely because the Next.js build passes.

Scoped npm overrides upgrade Firebase's transitive UUID v4 dependency and CLI
OpenTelemetry/basic-ftp security patches. Production dependencies pass npm audit.
The remaining development-only advisory is the unpatched braces parser in
ESLint/CLI tooling; do not apply npm's proposed forced major downgrades blindly.

Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:auth`,
`npm run test:search`, and `npm run test:audit`. Live provider mail/session,
Firestore and Storage checks remain pending project approval and credentials.

References: [App Hosting framework support](https://firebase.google.com/docs/app-hosting/frameworks-tooling),
[local-source deployment](https://firebase.google.com/docs/app-hosting/alt-deploy),
[App Hosting configuration](https://firebase.google.com/docs/app-hosting/configure),
[Auth REST API](https://firebase.google.com/docs/reference/rest/auth),
[session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies).
