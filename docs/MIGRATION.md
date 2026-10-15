# Migrating from the first version

The rebuild keeps the same Firebase project and the same collection names, so existing data keeps working with small differences.

| First version | Now | Action |
|---------------|-----|--------|
| `shops.floor`: `Ground`, `1st`, `2nd`, `3rd` | `G`, `1`, `2`, `3` | Rewrite the field. Rules reject the old values. |
| `shops.shopNumber` | `shops.unitId` such as `G-02`, picked from the floor plan | Map each old shop number to a free unit. |
| `shops.status` active or inactive | active, inactive (archived) or pending | No change needed. |
| `shops.category` free text | One of the nine categories in `src/lib/constants.js` | Map old values. |
| Any signed in user was an admin | Roles in `users/{uid}` | Run `scripts/make-admin.mjs` for administrators, then link owners on the People page. |
| `logs` writable by guests | Append only, staff only | Old entries remain readable by admins. |
| Cart in localStorage, orders never saved | Reservations in Firestore | Nothing to migrate. |

A one off script using the Admin SDK is the safest way to rewrite `floor`, `unitId` and `category` in bulk. Run it against the emulators with exported data first (`firebase emulators:start --import`).
