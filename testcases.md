# ApnaProperty Test Cases

Manual/browser checklist for the live ApnaProperty website. These are test cases, not automated Playwright tests.

**Live URL:** https://apna-property--apna-property-bijaya.asia-southeast1.hosted.app

## Homepage and search

| ID | Test | Steps | Expected result | Status |
|---|---|---|---|---|
| HP-01 | Open homepage | Visit the live URL | Homepage loads with the ApnaProperty title, navigation, hero and search form | **Passed** — [desktop evidence](evidence/HP-01/homepage-desktop.png) |
| HP-02 | Switch search purpose | Select Buy, Rent, Plot / Land and Commercial in turn | Selected purpose updates; relevant budget choices are shown | **Passed** — [Buy](evidence/HP-02/1-buy.png), [Rent](evidence/HP-02/2-rent.png), [Plot/Land](evidence/HP-02/3-plot-land.png), [Commercial](evidence/HP-02/4-commercial.png) |
| HP-03 | Search by location and purpose | Select Rent, enter Bhubaneswar, press Search Properties | Results show matching rental listings in Bhubaneswar | **Passed** — 2 sample properties; [evidence](evidence/HP-03/rent-bhubaneswar-results.png) |
| HP-04 | Search without filters | Press Search Properties with default values | Results section appears and lists available sample properties | **Passed** — 13 results; [evidence](evidence/HP-04/default-search-results.png) |
| HP-05 | Popular search shortcut | Select each popular-search button | Results reflect the selected location/category | **Passed** — Bhubaneswar 1, Cuttack 1, Bengaluru 3; [evidence](evidence/HP-05/) |
| HP-06 | Property category shortcut | Select each tile under “What feels like home?” | Results update to the chosen category | **Passed** — 6 categories; [evidence](evidence/HP-06/) |

## Listings and property details

| ID | Test | Steps | Expected result | Status |
|---|---|---|---|---|
| LS-01 | Featured listings render | Scroll to featured properties | Listing cards show image, purpose, price, title and location | **Passed** — [viewport](evidence/LS-01/featured-listings.png), [full page](evidence/LS-01/featured-listings-full.png) |
| LS-02 | Open property details | Select View Details on a listing | Details dialog opens for the selected property and can be closed | **Passed** — [open](evidence/LS-02/details-dialog.png), [closed](evidence/LS-02/details-dialog-closed.png) |
| LS-03 | Save a favourite | Select the save/heart control on a listing | Favourite state updates visibly | **Passed** — button changed to pressed “Unsave”; [evidence](evidence/LS-03/after-save.png) |
| LS-04 | Filter and sort results | Change category, purpose or sort order | Visible listings and result count update accordingly | **Passed** — counts changed 13 → 9 → 1; Clear restored 22; [evidence](evidence/LS-04/) |
| LS-05 | Empty search results | Enter a location with no matching listing and search | Clear empty-state message appears; page remains usable | **Passed** — 0 results and empty-state message; [evidence](evidence/LS-05/empty-results.png) |

## Navigation, account and responsive layout

| ID | Test | Steps | Expected result | Status |
|---|---|---|---|---|
| UI-01 | Desktop homepage layout | Open at desktop viewport | Header, hero, search form and sections display without clipping | **Passed** — [full-page evidence](evidence/UI-01/desktop-1440-fullpage.png) |
| UI-02 | Mobile homepage layout | Open at 390 × 844 viewport | Mobile header and search controls fit the viewport; page scrolls normally | **Passed** — [viewport](evidence/UI-02/mobile-390-viewport.png), [full page](evidence/UI-02/mobile-390-fullpage.png) |
| UI-03 | Mobile menu | Open the menu control on mobile | Navigation menu opens, links work, and menu can be dismissed | **Passed** — [open](evidence/UI-03/mobile-menu-open.png), [closed](evidence/UI-03/mobile-menu-closed.png) |
| UI-04 | Login / Sign Up | Select Login / Sign Up | Auth dialog opens; verify sign-in only after Firebase Auth is provisioned | **Partial** — dialog opens; Firebase says account services are not enabled, so real sign-in was not attempted; [evidence](evidence/UI-04/login-dialog.png) |
| UI-05 | Post Property | Select Post Property | Existing post-property dialog or flow opens without page errors | **Partial** — informative “coming soon” dialog opens; no listing submission is available; [evidence](evidence/UI-05/post-property-dialog.png) |
| UI-06 | Footer links and dialogs | Test footer navigation, Privacy policy and Terms of use | Each link or dialog opens the expected content | **Passed** — footer navigation, city/about anchors, support, Privacy and Terms checked; [evidence](evidence/UI-06/) |

## Notes

- The visible listings are sample/illustrative data; do not treat demo verification badges as real-world verification.
- Firebase-backed authentication checks require Firebase Auth and the App Hosting runtime environment variables to be configured.
- Screenshots are captured from the live website using Playwright CLI on 2026-10-20. Evidence is stored by test-case ID in `evidence/`.
- To run the project's existing automated browser audit, use `npm run test:audit`.
