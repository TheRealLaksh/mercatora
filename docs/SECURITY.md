# Security model

The browser is untrusted. Everything that matters is enforced in `firestore.rules` and `storage.rules`, and covered by tests in `tests/rules`.

## What the rules guarantee

- Nobody can create a profile with a role other than `shopper`, and nobody can change their own role or shop links.
- Only admins create or delete stores. Owners can change only the public profile fields of stores linked to them: tagline, description, hours, contact details, images and tags.
- Products can only be written by admins and by owners of that product's shop, and a product can never move to another shop. Prices must be numbers of zero or more, stock must be a whole number of zero or more.
- Public reads only see live stores, live products, published offers and published reviews.
- A reservation can only be created by a signed in shopper in their own name, in `requested` status, for an active store, with a bounded and well shaped payload. Shoppers can only withdraw a request that is still `requested`. Staff cannot edit totals or codes.
- A review document id is `{shopId}_{uid}`, so one review per shopper per store, and the author must be the caller. Owners cannot review their own store, and can change only `reply` on reviews of their store.
- Offers: owners only for their own store, mall wide only for admins. End cannot precede start.
- The audit log is append only, requires the caller's own uid and the server time, and is readable only by admins.
- Everything not listed is denied.

Storage: public read, writes limited to admins and owners of the matching shop folder, images only (JPEG, PNG, WebP), under 5 MB.

## Other protections

- All text is rendered through React, which escapes it. The original app wrote Firestore content into `innerHTML`, which was a stored XSS risk.
- Hosting sends a content security policy, `X-Content-Type-Options`, `X-Frame-Options: DENY`, a strict referrer policy and a permissions policy.
- Secrets: the web config keys are public by design. The only sensitive file is a service account for `scripts/make-admin.mjs`, which `.gitignore` blocks. `scripts/seed.mjs` refuses to talk to anything but the local emulators.
- Inputs are validated in the browser for friendliness and again by the rules for safety.

## Known gaps (and the fix)

| Gap | Why | Fix when needed |
|-----|-----|-----------------|
| Reservation item prices are client supplied | No server code on the free plan | Cloud Function that prices reservations from the catalog |
| Rating aggregates computed in the browser | Same | Function that maintains `shopStats/{id}` |
| A shopper can create many reservations | No rate limiting without a server | App Check plus a function with quotas |
| Roles live in Firestore, not custom claims | Setting claims needs the Admin SDK | Function that mirrors `role` into custom claims, which also removes one read per rules evaluation |

## Reporting

Email the project owner. Please do not open a public issue for a vulnerability.
