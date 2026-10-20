# ApnaProperty Test Cases

Manual/browser checklist for the live ApnaProperty website. These are test cases, not automated Playwright tests.

**Live URL:** https://apna-property--apna-property-bijaya.asia-southeast1.hosted.app

## Homepage and search

| ID | Test | Steps | Expected result | Status |
|---|---|---|---|---|
| HP-01 | Open homepage | Visit the live URL | Homepage loads with the ApnaProperty title, navigation, hero and search form | Passed (2026-10-19) |
| HP-02 | Switch search purpose | Select Buy, Rent, Plot / Land and Commercial in turn | Selected purpose updates; relevant budget choices are shown | Rent passed (2026-10-19); other modes pending |
| HP-03 | Search by location and purpose | Select Rent, enter Bhubaneswar, press Search Properties | Results show matching rental listings in Bhubaneswar | Passed: 2 sample properties (2026-10-19) |
| HP-04 | Search without filters | Press Search Properties with default values | Results section appears and lists available sample properties | Pending |
| HP-05 | Popular search shortcut | Select each popular-search button | Results reflect the selected location/category | Pending |
| HP-06 | Property category shortcut | Select each tile under “What feels like home?” | Results update to the chosen category | Pending |

## Listings and property details

| ID | Test | Steps | Expected result | Status |
|---|---|---|---|---|
| LS-01 | Featured listings render | Scroll to featured properties | Listing cards show image, purpose, price, title and location | Pending |
| LS-02 | Open property details | Select View Details on a listing | Details dialog opens for the selected property and can be closed | Pending |
| LS-03 | Save a favourite | Select the save/heart control on a listing | Favourite state updates visibly | Pending |
| LS-04 | Filter and sort results | Change category, purpose or sort order | Visible listings and result count update accordingly | Pending |
| LS-05 | Empty search results | Enter a location with no matching listing and search | Clear empty-state message appears; page remains usable | Pending |

## Navigation, account and responsive layout

| ID | Test | Steps | Expected result | Status |
|---|---|---|---|---|
| UI-01 | Desktop homepage layout | Open at desktop viewport | Header, hero, search form and sections display without clipping | Passed (2026-10-19) |
| UI-02 | Mobile homepage layout | Open at 390 × 844 viewport | Mobile header and search controls fit the viewport; page scrolls normally | Passed (2026-10-19) |
| UI-03 | Mobile menu | Open the menu control on mobile | Navigation menu opens, links work, and menu can be dismissed | Pending |
| UI-04 | Login / Sign Up | Select Login / Sign Up | Auth dialog opens; verify sign-in only after Firebase Auth is provisioned | Pending — Firebase setup required |
| UI-05 | Post Property | Select Post Property | Existing post-property dialog or flow opens without page errors | Pending |
| UI-06 | Footer links and dialogs | Test footer navigation, Privacy policy and Terms of use | Each link or dialog opens the expected content | Pending |

## Notes

- The visible listings are sample/illustrative data; do not treat demo verification badges as real-world verification.
- Firebase-backed authentication checks require Firebase Auth and the App Hosting runtime environment variables to be configured.
- To run the project's existing automated browser audit, use `npm run test:audit`.
