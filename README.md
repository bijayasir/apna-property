# ApnaProperty

A premium Indian real-estate marketplace frontend built with Next.js 16, React 19 and TypeScript. The existing homepage uses navy, ivory, burgundy and restrained gold accents, with responsive property search and local sample listings.

## Development and validation

```sh
npm install
npm run dev
```

Open http://localhost:3000. In Windows PowerShell environments that block npm.ps1, use `npm.cmd` instead of `npm`.

```sh
npm run typecheck
npm run lint
npm run test:search
npm run test:auth
npm run build
npm run test:audit
```

Build before running the browser audit. It starts its own production server on port 3100; keep that port free. It checks all 22 listings and detail dialogs, search, sorting, favourites, navigation, placeholders, console errors, images and nine viewport sizes. Screenshots and machine-readable results are saved in `test-results/`.

On Windows the audit uses Microsoft Edge when installed. Otherwise install Chromium with `npx playwright install chromium`, or set `APNA_BROWSER_EXECUTABLE` to a compatible Chromium executable. Network access is needed to verify the existing Unsplash imagery.

## Structure

- `app/page.tsx`: homepage composition and interactive state.
- `app/data/properties.ts`: local listings, cities, categories and currency formatting.
- `app/lib/property-search.ts`: filtering and immutable sorting.
- `app/components/`: reusable cards, details, results controls and icons.
- `app/globals.css` and `app/components/listings.css`: premium design and responsive listing styles.
- `scripts/check-property-search.mjs`: data, filter, sorting and project UTF-8 checks.
- `tests/frontend-audit.spec.mjs`: browser regression coverage.

## Current scope

Search, filtering, sorting, favourites and property details work locally. Favourites last for the current page session. Listings, prices, photos, availability and verification labels are illustrative.

Sell and Post Property open a preview dialog; no posting form or submission exists. Login / Sign Up now opens real authentication forms with a server-only Firebase integration that remains disabled until configured. See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) and [AUTH_SETUP.md](AUTH_SETUP.md) and `.env.example` for the required project setup. Live listings, listing storage, image uploads, moderation, property verification, owner contact and account-backed favourites require a later phase. Help, privacy and terms dialogs explain the current scope.

See [AUDIT.md](AUDIT.md) for the latest findings and validation evidence.
