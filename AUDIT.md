# ApnaProperty functional and technical audit

Audited on 5 October 2026. The existing project, premium identity, imagery, sections and layout were preserved. No backend or authentication was added.

Subsequent authentication work replaces the login placeholder with validated forms and a server-only Firebase foundation. Firebase project approval and live configuration are still required. See [AUTH_SETUP.md](AUTH_SETUP.md) and [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for current setup and limitations. The findings below describe the earlier audit; the expanded regression suite now includes authentication tests.

## WORKING

| Area | Verified behavior |
| --- | --- |
| Header and navigation | Buy, Rent, Land / Plots and Commercial select the correct purpose. Sell opens the current posting preview. Branding links return to the top. Mobile navigation opens, closes and responds to Escape. |
| Search | City and neighbourhood searches are case-insensitive and trim surrounding spaces. Property type and budget combine correctly. Search Properties and Enter submit the form. Rent budgets use monthly amounts. |
| Popular searches | Bhubaneswar apartments, Cuttack plots and Bengaluru homes return the expected listings. |
| Categories and cities | All six category buttons and all seven city links return the expected results, including Puri and the existing Mumbai sample. |
| Listings | All 22 sample listings load. Buy, Rent, Plot / Land and Commercial filters work; Commercial includes sale and rental listings. Category filters and both price sort directions work. Recommended sorting restores the original order. |
| Clear and empty states | Clear all filters resets purpose, category, location, budget, sorting and saved-only mode. It preserves saved properties. Searches with no matches and saved-only searches with no matches show the correct empty states. |
| Cards | All prices, locations, BHK/type, areas and demo verification badges agree with the source data. View Details and favourite buttons work. |
| Favourites | Adding and removing properties updates button states and the counter. Saved-only viewing works. Removing a favourite from details also updates the card and result count. Favourites last for the current page session. |
| Details | Every property was opened and checked for matching title, location, price, description, bedrooms/type, area, furnishing, amenities, listing reference and verification status. Closing works through the close button, Escape and actual backdrop clicks. |
| Footer | Property navigation, about/city links, posting, help, privacy and terms controls all respond. Informational dialogs describe this frontend preview. |
| Responsive layout | Chromium/Edge viewport checks at 320, 375, 540, 700, 768, 960, 1050, 1200 and 1440 pixels passed. No page-level horizontal overflow was detected. Details and mobile navigation work at these sizes. |
| Images and runtime | All unique existing hero, city and listing image URLs returned successful image responses. Browser image decoding and nonzero image dimensions also passed; responsive screenshots were captured after images loaded. No browser JavaScript, hydration, console or failed local asset errors were detected in the production runtime check. |

## FIXED

- All-listing and city browsing no longer incorrectly activate the Buy tab. Searching again preserves the selected all-listing scope.
- Back to featured clears stale form filters and restores the default Buy tab while retaining favourites.
- Clicking inside dialog padding no longer closes the modal; only a real backdrop click does.
- Dialogs reset their scroll position on opening and prevent background page scrolling while open.
- Dialog closing restores focus to the triggering control, or to the mobile menu toggle when the originating menu is closed.
- Sell and other dialog actions close the mobile navigation menu.
- Mobile navigation has an explicit accessible control relationship and supports Escape with focus return.
- The skip link transfers keyboard focus to the main content and remains visually hidden until focused.
- Programmatic search/navigation scrolling now respects reduced-motion preferences.
- Added repeatable browser regression tests, package scripts, screenshots and machine-readable evidence. Expanded UTF-8 validation to project text/source files.
- Updated the README to describe the actual project and its current capabilities rather than the starter template.

## Technical validation

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test:search` | Passed: data integrity, combined filtering, boundaries, empty/reset results, immutable sorting and UTF-8 |
| `npm run build` | Passed: production compilation, TypeScript and static generation |
| `npm run test:audit` | 22 browser tests passed against the production build |
| `npm audit --omit=dev --json` | Zero production dependency vulnerabilities reported |

Browser results: `test-results/audit-results.json`. Responsive screenshots: `test-results/homepage-<width>.png` and `test-results/listings-<width>.png`. These generated artifacts are ignored by Git. The test configuration runs its own production server on port 3100 and uses installed Edge on Windows, with Chromium fallback elsewhere.

## STILL PENDING

- The full npm dependency audit reports five high-severity entries in the development-only ESLint dependency chain: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces@3.0.3`. These entries trace to one underlying braces advisory. The [GitHub advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched version. npm suggests downgrading the Next ESLint configuration to a different major version; that unsafe downgrade was not applied. Track an upstream patch and rerun the full audit before release.
- Safari, Firefox and physical-device testing were not performed. Responsive checks used Chromium/Edge with the viewport widths listed above.
- Favourites intentionally reset on a page reload; persistent account-backed favourites are not implemented.
- Buy/Rent should be selected when comparing prices on the same basis. Sorting mixed listings uses displayed numeric amounts; the UI explains that rentals are monthly and sale prices are totals.

## BACKEND REQUIRED

Post Property and Sell currently open an explanatory placeholder. A real implementation still needs a property-entry form, validation, photo uploads, listing submission/storage, ownership controls, editing and moderation.

Login / Sign Up currently opens an explanatory placeholder. Authentication, account creation, sessions, account recovery and protected owner/agent pages remain unimplemented.

Live inventory, verified-property workflows, owner contact/enquiries and account-backed favourites require database/API services. Current demo verification badges do not represent actual verification. No payment functionality exists or was added.

## READY FOR NEXT PHASE

The audited frontend is ready for the next development phase: property posting and account workflows. It is not yet a live marketplace. All existing working frontend features and the premium design remain intact. The unpatched development dependency advisory must continue to be tracked.
