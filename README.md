# Mercatora

A mall directory and management platform. Shoppers browse stores, find them on an interactive floor map, see offers and events, read and write reviews, and reserve products for pickup. Store owners run their own store. Mall administrators run everything.

Built with React, Vite, Tailwind CSS and Firebase (Authentication, Firestore, Storage, Hosting). Prices are in Indian rupees. The seeded demo mall is fictional.

## What is in it

**Public site**
- Directory with search, category, floor and open now filters, sorting and shareable URLs
- Store pages with live products, opening hours, contact details, offers and reviews
- Interactive SVG floor plans for four levels, with search and deep links from store pages
- Offers and events that appear and expire on their own
- Reserve and pick up: a bag that splits into one reservation per store, with a pickup code for each
- Favourites that work as a guest and merge into your account when you sign in
- Plan your visit page with live hours, parking and facilities
- Light and dark themes

**Console (administrators and store owners)**
- Overview with a 14 day reservation chart, items needing attention and recent activity
- Stores: onboard tenants, assign a free floor unit, archive, restore or delete with cascade
- Products: full catalog with images, inline stock adjustment, drafts and archive
- Reservations: live queue. Confirming holds stock, cancelling or expiring releases it, handover requires the shopper's code
- Offers and events with scheduling and publishing
- Reviews: owners reply, administrators hide or delete
- People: promote shoppers to store owners and link them to stores (administrators)
- Audit log: append only record of every change (administrators)
- Mall settings: hours, contact, parking and facilities (administrators)

## Roles

| Role | Can do |
|------|--------|
| Guest | Browse everything public. Favourites stay on the device. |
| Shopper | Reserve, review, keep favourites on the account. |
| Store owner | Manage the products, offers, reservations and reviews of the stores linked to them, and edit those stores' public profile. |
| Administrator | Everything, including tenancy, people, settings and the audit log. |

Roles are stored in `users/{uid}.role` and enforced by Firestore and Storage security rules, not by the UI. Nobody can promote themselves.

## Quick start (no Firebase keys needed)

You need Node 20 or newer and Java 11 or newer (for the emulators).

```bash
npm install

# terminal 1: Firebase Local Emulator Suite
npm run emulators

# terminal 2: fill it with a fictional mall, then start the app against it
npm run seed
npm run dev:emu
```

Open http://localhost:5173. Every demo account uses the password `Mercatora#2026`:

| Role | Email |
|------|-------|
| Administrator | admin@mercatora.test |
| Store owner (Kaveri Loom) | owner.kaveri@mercatora.test |
| Store owner (Voltix and Soundstage) | owner.voltix@mercatora.test |
| Store owner (Masala Library) | owner.masala@mercatora.test |
| Shopper | shopper@mercatora.test |

The emulator UI is at http://localhost:4000. Re-running `npm run seed` resets everything. The seed script only ever talks to the local emulators.

## Running against your real Firebase project

1. Copy `.env.example` to `.env` and fill in the web app keys from the Firebase console.
2. Deploy rules and indexes: `npx firebase deploy --only firestore,storage`
3. Start the app, create an account on the Register page, then promote it. Roles cannot be set from the browser, so the first administrator is created with a script:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
   node scripts/make-admin.mjs you@example.com
   ```
   Never commit the service account file. `.gitignore` already blocks `serviceAccount*.json`.
4. Sign in, open the console, edit Mall settings, onboard stores, then link each owner to their store on the People page.
5. Build and deploy: `npm run build && npx firebase deploy --only hosting`

The Hosting config adds security headers including a content security policy, rewrites every route to the single page app, and caches hashed assets for a year.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server against your real Firebase project |
| `npm run dev:emu` | Vite dev server against the local emulators |
| `npm run emulators` | Start Auth, Firestore and Storage emulators |
| `npm run seed` | Reset the emulators and load demo data |
| `npm run build` | Production build into `dist` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:rules` | Security rules tests inside a fresh emulator |
| `npm run test:e2e` | Browser tests (Playwright) against seeded emulators |

## Project layout

```
src/
  lib/          pure logic: hours, bag math, validation, floor plans, formatting (unit tested)
  services/     everything that talks to Firebase, one file per collection
  context/      auth, theme, bag, favourites, settings, toasts, confirm dialogs
  hooks/        live Firestore queries and small utilities
  components/   ui kit, layout, art, map, shop pieces and console pieces
  pages/        public pages and console pages (the console loads on demand)
firestore.rules, storage.rules, firestore.indexes.json, firebase.json
scripts/        seed, seed data, make-admin
tests/rules/    security rules tests
e2e/            Playwright specs
docs/           audit, architecture, security notes
```

## Documentation

- [Audit of the original codebase](docs/AUDIT.md)
- [Architecture and data model](docs/ARCHITECTURE.md)
- [Security model](docs/SECURITY.md)
- [Migrating data from the first version](docs/MIGRATION.md)

## Known limits

These are deliberate trade-offs of staying on the free Firebase plan with no server code. They are documented so you can decide when to move past them.

- Reservation prices come from the shopper's browser at creation time. Staff see the live catalog price and total when they confirm. A Cloud Function that prices reservations server side is the upgrade.
- Review scores are computed in the browser from published reviews. Fine for a mall sized directory. Past a few thousand reviews, keep a per store aggregate maintained by a function.
- Shoppers cannot cancel after a store confirms, because releasing held stock needs store permissions. They contact the store, which cancels and releases the stock.
- Storage rules look up roles in Firestore. The Storage rules tests are opt in (`RUN_STORAGE_RULES=1`) because some sandboxes cannot route that lookup between emulators.

## Licence

MIT
