# Mercatora handoff

Last updated: 16 October 2026. Written for whoever picks this up next, human or agent. Read this first, then `README.md`.

## 1. State in one paragraph

Mercatora was rebuilt from scratch on branch `claude/practical-gauss-uwtg3s` (repo `TheRealLaksh/mercatora`), replacing a 1,750 line vanilla JS app. It is now a React 18, Vite 8, Tailwind 4 and Firebase (Auth, Firestore, Storage, Hosting) mall directory with a role based admin console. Everything runs and is tested against the Firebase Local Emulator Suite. It has **not** been run against the live Firebase project (`mercatora-75752`), **not** deployed, and **no pull request** has been opened. Commit `7313d7c` holds the rebuild; this handoff is added on top of it.

## 2. What the owner asked for and decided

The brief: deeply audit the old code, plan it, redesign UI and backend completely, make it fully functional, look authentic and aesthetically good, never use em dashes, and ask questions only through polls before starting. Full access was granted, no approval needed.

Poll answers (three rounds):

| Question | Answer |
|----------|--------|
| Product scope | Mall directory plus admin. Cart becomes reserve and pick up, no payments. |
| Backend | Keep Firebase and harden it. No Cloud Functions. |
| Frontend | React + Vite + Tailwind |
| Look | Editorial luxury, light default, tuned dark mode |
| Dev data | Emulator plus seed data |
| Roles | Admin, Shop owner, Shopper |
| Extras (all four) | Interactive floor map, offers and events, real ratings and reviews, opening hours and visitor info |
| Demo mall | Fictional Indian mall, prices in INR |
| Images | Storage uploads plus curated fallback |
| Theme | Light default, dark available |
| Delivery | Commit to the branch, no PR |

Standing rule from the owner: **no em dashes or en dashes anywhere** (UI copy, docs, comments). Verify with `grep -rn "—\|–" README.md docs src scripts tests e2e HANDOFF.md`, which should print nothing.

## 3. Resume in five minutes

Needs Node 20+ (22 used) and Java 11+ (21 used) for the emulators.

```bash
cd mercatora
git checkout claude/practical-gauss-uwtg3s
npm install
npm run emulators        # terminal 1: Auth 9099, Firestore 8080, Storage 9199, UI 4000
npm run seed             # terminal 2: resets emulators and loads the demo mall
npm run dev:emu          # app at http://localhost:5173
```

Demo accounts, all with password `Mercatora#2026`:

| Role | Email | Notes |
|------|-------|-------|
| Administrator | admin@mercatora.test | everything |
| Owner | owner.kaveri@mercatora.test | Kaveri Loom only |
| Owner | owner.voltix@mercatora.test | Voltix and Soundstage (tests the store switcher) |
| Owner | owner.masala@mercatora.test | Masala Library |
| Shopper | shopper@mercatora.test | has favourites and seeded reservations |

Other seeded shoppers: aarav, diya, kabir, meera, rohit (`@mercatora.test`). The seed script only ever talks to the emulators and refuses otherwise.

### Verification commands

| Command | Expected |
|---------|----------|
| `npm run lint` | no output |
| `npm test` | 45 unit tests pass (4 files) |
| `npm run build` | builds, entry chunk about 6 kB, vendor chunks `firebase` and `react` |
| `npm run test:rules` | 44 Firestore rules tests pass, 7 Storage tests skipped (see gotchas) |
| `RUN_STORAGE_RULES=1 npm run test:rules` | also runs the 7 Storage tests (could not be verified here) |
| `npm run test:e2e` | 22 Playwright tests pass, about 70 seconds. It starts emulators, seeds, runs. |

Last full result before this handoff: lint clean, 45 of 45 unit, 44 of 44 rules, 22 of 22 e2e, build clean. axe scans over home, stores, map, what's on, visit, login, and three console pages were clean in light and dark after the fixes below.

## 4. Architecture map

```
src/
  main.jsx            entry; shows SetupNotice if Firebase config is missing, else lazy loads App
  App.jsx             providers + data router; console and secondary public pages are lazy
  lib/                pure logic, unit tested, no React and no Firebase imports except firebase.js
    firebase.js         init, emulator wiring (VITE_USE_EMULATORS=true), isConfigured
    constants.js        categories, floors, statuses, DEFAULT_SETTINGS (keep in sync with rules)
    hours.js            open now logic, IST aware, overnight hours
    floorPlans.js       4 floors x 24 units, geometry in code
    cartMath.js         bag operations (pure)
    schemas.js          validators shared by forms and services, ValidationError, clean()
    format.js, code.js, ratings.js, validate.js
  services/           ALL Firestore and Storage access. One file per collection. Writes stage audit entries
                      in the same batch or transaction (services/audit.js)
  context/            Auth (user + users/{uid} profile + role), Theme, Toast, Confirm, Settings (live
                      settings/mall), Shops (shared public shop and review subscription), Bag, Favorites
  hooks/              useCollection and useDocument (onSnapshot wrappers), small utilities
  components/
    ui/                 Button, Field (Input/Select/Textarea/Switch), Badge, Modal (Overlay, Drawer),
                        Feedback, Stars, Tabs, Logo, ImageUpload, HoursEditor
    art/Art.jsx         deterministic generated artwork, SmartImage fallback, ShopLogo/Cover, ProductImage
    layout/             Header, Footer, AccountMenu, ThemeToggle, PublicLayout, RequireRole, SetupNotice
    shop/               ShopCard, ProductCard, ProductModal, BagDrawer, Reviews, OfferCard, HoursList ...
    map/FloorMap.jsx    SVG floor plan
    console/            ConsoleLayout, ConsoleContext, ui.jsx (tables, stats), ShopForm, ProductForm, OfferForm
  pages/public/       Home, Stores, ShopDetail, MapPage, WhatsOn, Visit, Favorites, Reservations,
                      AuthPage (login/register/reset), Account, NotFound
  pages/console/      Dashboard, Stores, Products, Reservations, Offers, Reviews, Users, Audit, Settings
firestore.rules  storage.rules  firestore.indexes.json  firebase.json  .firebaserc
scripts/            seed.mjs, seed-data.mjs, make-admin.mjs
tests/rules/        firestore.test.js, storage.test.js
e2e/app.spec.js     Playwright flows;  playwright.config.js
docs/               AUDIT, PLAN, ARCHITECTURE, SECURITY, MIGRATION
.github/workflows/ci.yml
```

Layering rules: UI never imports Firestore directly (only hooks and services do), services never import React, `lib` imports nothing else from the app.

### Routes

Public: `/`, `/stores`, `/stores/:id`, `/map?floor=&shop=`, `/whats-on`, `/visit`, `/favorites`, `/reservations`, `/account`, `/login`, `/register`, `/forgot`, and a 404.
Console (`admin` and `owner`): `/console`, `/stores`, `/products`, `/reservations`, `/offers`, `/reviews`. Admin only: `/console/users`, `/console/audit`, `/console/settings`.

### Data model

`users/{uid}` (role, shopIds[], favorites[]), `shops`, `products`, `reservations`, `reviews/{shopId}_{uid}`, `offers` (kind offer or event, shopId or null for mall wide), `settings/mall`, `logs` (append only). Details in `docs/ARCHITECTURE.md`.

## 5. Behaviour that is easy to get wrong

1. **Stock is held on confirm, not on request.** `moveReservation` in `services/reservations.js` runs a transaction: requested to confirmed decrements stock (fails if insufficient), confirmed or ready to cancelled or expired restores it. Shoppers can only withdraw while `requested`, because releasing held stock needs staff permissions.
2. **Pickup code visibility.** Staff never see the code in the queue; they must type the shopper's code to hand over (case and punctuation insensitive). Shoppers see the code only while the reservation is active.
3. **Roles live in `users/{uid}.role`.** Users create their own profile as `shopper` only. Only admins change role or `shopIds`. The first admin is created with `scripts/make-admin.mjs` (needs a service account, never commit it).
4. **Owners are scoped per shop.** The console loads each owned shop document individually because rules authorise by document id and an `in` query would be denied. Owner pages query one shop at a time via the store switcher.
5. **Owner edit limit.** Owners can only update `tagline, description, hours, phone, email, website, logoUrl, coverUrl, tags, updatedAt` on their shop. `ShopForm ownerOnly` and `OWNER_FIELDS` mirror the rule. Change all three together.
6. **Unit assignment.** A shop stores `unitId` like `2-05`. Archived shops free their unit. A shop keeps its own unit in the picker (`vacantUnits`).
7. **Reads of missing documents.** Rules for `products` and `reviews` allow `resource == null` so clients can probe for absent docs (needed to save a first review and to tolerate deleted products). Keep that if you edit the rules.
8. **Ratings** are aggregated in the browser from all published reviews (`ShopsContext`).
9. **Audit entries** are staged with `stageAudit(writer, ...)` into the same batch or transaction as the change. Add one whenever you add a new write.
10. **Open now** uses the mall time zone from settings (default Asia/Kolkata), not the viewer's zone.
11. **Generated artwork** is deterministic from name, id and category. Photos uploaded to Storage replace it automatically; any broken image URL falls back to it.
12. Floor plan geometry is code (`floorPlans.js`). There is no map editor.

## 6. Gotchas hit during the build (save yourself the time)

- **Duplicate `@firebase/app`** caused "Service firestore is not available". Fixed with `npm dedupe`. If it returns after installs, run `npm dedupe` and `rm -rf node_modules/.vite`.
- **Version pins:** `firebase@^12` (rules-unit-testing peers 12, not 13) and `eslint@9` (eslint-plugin-react does not support 10 yet).
- **Vite 8 uses Rolldown.** Manual chunks are configured with `build.rolldownOptions.output.codeSplitting.groups` in `vite.config.js`, not `manualChunks`.
- **React 18 prop casing:** use lowercase `fetchpriority` on `<img>`.
- **Do not edit `src/` while Playwright runs.** Vite hot reload detaches elements mid test and produces confusing "element not stable or detached" failures.
- **E2E mutates data.** Reseed before every run (`npm run test:e2e` does it). Running specs twice against the same data will fail, for example the review and reservation flows.
- **Never `pkill -f "vite --port"` from a shell command containing that string,** it kills your own shell (exit 144). Kill by pid.
- **Emulator log noise is harmless:** `EAFNOSUPPORT ::1` (no IPv6 in the sandbox) and `JAVA_TOOL_OPTIONS ... Unexpected rules runtime error` warnings.
- **Storage emulator cross service lookup fails in the build sandbox.** Even `firestore.exists()` from Storage rules returned null, so every positive Storage case failed there. The Storage rules are unverified in practice. `storage.test.js` is skipped unless `RUN_STORAGE_RULES=1`. Run it on a normal machine and fix the rules or the test if it fails there.
- **Unsplash is blocked in the sandbox,** so the Home hero photo (`photo-1519567241046-7f570eee3c9f`, the one the old app used) was never seen loading. It falls back to artwork. The CSP in `firebase.json` allows `images.unsplash.com`.
- **Playwright browser:** `playwright.config.js` uses `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` when present, otherwise `CHROMIUM_PATH`, otherwise Playwright's own download.
- **`firestore.indexes.json`** declares composite indexes the emulator does not enforce. Deploy rules and indexes before using a real project: `npx firebase deploy --only firestore,storage`.
- Firebase config is not needed for emulator mode. Without keys and without `VITE_USE_EMULATORS=true`, the app shows a setup screen instead of crashing.

## 7. Known gaps, with the fix for each

| Gap | Impact | Fix |
|-----|--------|-----|
| Reservation item prices come from the shopper's browser | A tampered client could submit a lower price. Payment is in store and staff see live catalog prices when confirming, so impact is low. | Cloud Function that prices reservations from the catalog |
| Review scores computed in the browser from every published review | Fine for a few thousand reviews, wasteful beyond | Function maintaining `shopStats/{id}` |
| Shoppers cannot cancel after confirm | Intentional, stock release needs staff rights | Function to release stock on shopper cancel |
| No rate limiting | A shopper can spam reservations | App Check plus function quotas |
| Roles are read from Firestore on every rules evaluation | Extra read cost | Mirror role into custom claims with a function |
| Storage rules unverified (see gotchas) | Uploads could be wrongly blocked or allowed | Run `RUN_STORAGE_RULES=1 npm run test:rules` on a normal machine |
| Home hero photo and real photography never seen | Cosmetic | Open the site with internet access and check |
| No mobile or Firefox or Safari automated run | Only Chromium desktop in Playwright; mobile and dark were checked by screenshot and axe | Add `devices['iPhone 14']` and WebKit projects |
| Console tables scroll horizontally on phones | Usable, not ideal | Card layout under 640 px |

## 8. Not done

- Not deployed. No live Firebase project was touched. No `.env` was created.
- No pull request. Owner chose commits on the branch only.
- Data from the old app is not migrated. See `docs/MIGRATION.md` (floor names, unit ids, categories, roles).
- No password reset email was exercised (the emulator prints links; real project needs the Auth email template and an authorised domain).
- No Google or other social sign in, only email and password.
- No notifications (email or push) for reservation changes. Staff see them live in the console only.
- The sibling repo `TheRealLaksh/obsidian-vault` is in scope for this session but untouched. Its `CLAUDE.md` asks for one note per project in `02 Projects/` with specific frontmatter. A Mercatora project note was not created (offered, not requested).

## 9. Suggested next steps, in order

1. **Review and merge.** Skim `docs/AUDIT.md`, run the five commands in section 3, then open a PR from `claude/practical-gauss-uwtg3s` to `master` if happy.
2. **Go live on Firebase.** Fill `.env`, deploy rules and indexes, build, deploy hosting, run `make-admin`, set Mall settings, onboard real stores, link owners on the People page. Steps are in `README.md`.
3. **Verify Storage rules** with `RUN_STORAGE_RULES=1` and upload a real logo and product photo from an owner account.
4. **Migrate old data** using `docs/MIGRATION.md` on exported emulator data first.
5. **Close the Cloud Functions gaps** (server priced reservations, rating aggregates, claims) once the free plan limit is acceptable to lift.
6. **Add real photography** per store and replace the hero.
7. **Extend tests** to WebKit and a phone viewport, and add a rules test for every new collection you add.
8. Nice to have: reservation emails or push, a floor plan editor, mall wide product search, pagination in the console tables, multi language copy.

## 10. How to extend safely

New collection or field, in this order:
1. `lib/schemas.js` validator and a unit test.
2. `firestore.rules` entry (default is deny) and tests in `tests/rules/firestore.test.js`, including a negative case for every role.
3. `services/<name>.js` with writes that call `stageAudit`.
4. UI in `pages/` or `components/`, using `useCollection` for live data.
5. Seed data in `scripts/seed-data.mjs` and an e2e flow if it is user facing.
6. Update `docs/ARCHITECTURE.md` and `docs/SECURITY.md`.

Taxonomy lives in `lib/constants.js` and is duplicated in `firestore.rules` (`validShop` categories and floors). Change both.

Design tokens live in `src/styles/index.css` (CSS variables, light and dark). Fonts are Instrument Serif and Inter, bundled through `@fontsource`. Use the token classes (`bg-paper`, `text-ink`, `border-line`, `text-brass`) rather than raw colours so dark mode keeps working, and check any new colour pairs with axe (4.5 to 1 minimum).

## 11. Key files to read first

`docs/AUDIT.md`, `firestore.rules`, `src/services/reservations.js`, `src/context/AuthContext.jsx`, `src/components/console/ConsoleContext.jsx`, `src/lib/hours.js`, `e2e/app.spec.js`, `scripts/seed.mjs`.
