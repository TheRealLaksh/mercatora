# Mercatora Audit (October 2026)

Scope: the original vanilla JS + Vite + Firebase codebase (about 1,750 lines, 21 source files, 19 commits).

## Severity key
P0 = broken or exploitable, P1 = serious functional gap, P2 = quality or maintainability, P3 = polish.

## Security

| ID | Sev | Finding | Where |
|----|-----|---------|-------|
| S1 | P0 | No Firestore security rules in the repo. `firebase.json` only configures hosting. Whatever rules exist in the console are unreviewed, and the client talks to Firestore directly. | `firebase.json` |
| S2 | P0 | "Admin" means "anyone who can sign in". `main.js` routes every authenticated user to the admin console. There is no role model at all. | `src/main.js` |
| S3 | P0 | Stored XSS. 32 `innerHTML` writes interpolate shop names, product names and descriptions straight from Firestore without escaping. A shop owner or anyone with write access can inject script into every visitor's page. | `src/ui/**` |
| S4 | P1 | Audit log is writable from the client by guests (`performedBy: "System/Guest"`) and nothing makes it immutable, contradicting the README claim of "immutable tracking". Only shop creation is logged; deletes and product changes are not. | `loggerService.js` |
| S5 | P1 | Client-only validation. Prices, stock and floor values are validated in the browser and nowhere else. | `shopService.js`, `productService.js` |
| S6 | P2 | No Storage rules, no upload path. Image fields do not exist. | n/a |
| S7 | P2 | No security headers on Hosting (CSP, frame options, referrer policy). | `firebase.json` |

## Functional gaps

| ID | Sev | Finding |
|----|-----|---------|
| F1 | P0 | Build breaks on case-sensitive file systems. `main.js` imports `./ui/auth/loginView` but the files are `src/ui/Auth/loginview.js`. Works on Windows, fails on Linux CI and most deploy targets. |
| F2 | P1 | Checkout is fake. "Place Order" clears local storage and shows a toast. Nothing is saved, no shop is notified, stock never changes, the two input fields are never read. |
| F3 | P1 | Ratings are fake. `Math.random()` generates a rating on every render, so the same shop shows a different score each time. |
| F4 | P1 | "Happening Now" offers are hardcoded HTML (Black Friday, live music). No way to manage them. |
| F5 | P1 | Deleting a shop orphans its products. Delete is hard delete with a browser `confirm()`. |
| F6 | P1 | No routing. Views are swapped by replacing `innerHTML`, so there are no shareable URLs, the back button leaves the app, and refresh drops you on the home page. |
| F7 | P1 | Product catalog has no edit, no images, no descriptions, no categories, no search. Shops cannot be edited after creation. |
| F8 | P1 | Dashboard shows three counters. No reservations, no activity, no trends. |
| F9 | P2 | Wishlist is localStorage only and lost across devices. Cart item prices are copied into storage and can go stale. |
| F10 | P2 | `loggerService` and `shopService` mix concerns (a service that logs and validates and talks to Firestore). Orphaned "Keep existing code" comments show it was patched by paste. |
| F11 | P2 | `getAllProducts` and `getAllShops` fetch whole collections on every view. No pagination or caching. |

## Code quality

| ID | Sev | Finding |
|----|-----|---------|
| Q1 | P2 | 175 inline `style=""` attributes beat the stylesheet, so theming and responsiveness are accidental. Dark mode class `.dark-theme` is defined but nothing toggles it. |
| Q2 | P2 | Global event listeners (`cart-updated`) are added on every `init()` and never removed, so they leak on each navigation. |
| Q3 | P2 | Seven debug `console.log` calls shipped. `alert()` and `confirm()` are used for UX. |
| Q4 | P2 | No tests, no linting, no formatter, no CI. |
| Q5 | P2 | README documents a design that does not match the code (it describes `/src/ui` as DOM-only and shows an LLD that was never written to disk). |
| Q6 | P3 | `index.html` points at `/vite.svg`, which does not exist. No meta description, no theme color, no social tags. |
| Q7 | P3 | No loading, empty or error states beyond a skeleton on the home page. |
| Q8 | P3 | Accessibility: icon-only buttons without labels, emoji as icons, no focus styles on custom buttons, color-only state, no skip link. |

## Design
The old UI is a generic blue SaaS template with emoji icons, gradient cards and a stock hero photo. It has no brand voice, no typographic system, no spacing scale and is hard to extend.

## Decisions taken with the owner (poll answers)
- Product: mall directory plus admin console, with shop owner and shopper roles.
- Backend: stay on Firebase, harden it (rules, roles, Storage). No paid Cloud Functions dependency.
- Frontend: React + Vite + Tailwind.
- Look: editorial luxury, light default with a tuned dark mode.
- Cart: reserve and pick up, no payments.
- Extras: interactive floor map, offers and events, real ratings and reviews, opening hours and visitor info.
- Dev data: Firebase Emulator Suite with a seeded fictional Indian mall.
- Images: Firebase Storage uploads, with generated art as the fallback.
- Delivery: commits on `claude/practical-gauss-uwtg3s`, no pull request.
