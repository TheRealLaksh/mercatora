# Architecture

## Layers

```
pages and components   React, Tailwind. No Firebase imports except in hooks and services.
context                Auth (user and role), theme, bag, favourites, settings, toasts, confirm dialogs.
services               One file per collection. All writes go through here.
lib                    Pure functions. No React, no Firebase. Unit tested.
Firebase               Auth, Firestore, Storage, Hosting. Rules are the real access control.
```

Rules of thumb: UI never writes to Firestore directly, services never import React, and `lib` imports nothing from the other layers.

## Data model

| Collection | Key fields | Who writes |
|------------|-----------|------------|
| `users/{uid}` | displayName, email, role, shopIds[], favorites[] | The user creates it as `shopper`. Only admins change role or shopIds. |
| `shops/{id}` | name, category, floor, unitId, status, tagline, description, hours, contact, logoUrl, coverUrl, tags, featured | Admins. Owners can edit the public profile fields only. |
| `products/{id}` | shopId, name, price, mrp, stock, status (active, draft, archived), imageUrl | Admins and the owners of that shop. |
| `reservations/{id}` | shopId, shopperUid, items[], total, code, status, timestamps | Shoppers create and withdraw. Staff move it along. |
| `reviews/{shopId_uid}` | rating, text, status, reply | One per shopper per shop by construction of the id. |
| `offers/{id}` | kind (offer or event), title, startsAt, endsAt, published, shopId or null | Admins, and owners for their own shop. |
| `settings/mall` | name, hours, address, parking, facilities | Admins. |
| `logs/{id}` | action, details, entity, performedBy, uid, timestamp | Append only. Admins and owners create, only admins read. |

Floor plans are code (`src/lib/floorPlans.js`): four levels with 24 units each. A shop stores a `unitId` such as `2-05` and the map draws it.

## Reservation lifecycle

```
requested -> confirmed -> ready -> collected
     |           |          |
     v           v          v
 cancelled   cancelled   cancelled / expired
```

- `requested`: created by the shopper. No stock is held.
- `confirmed`: a store member confirms. In one transaction the app checks stock, decrements it and writes the audit entry.
- `ready`, `collected`: no stock change. Handover requires the six character pickup code.
- `cancelled` or `expired` from `confirmed` or `ready`: the same transaction puts the stock back.

## Audit trail

Every service write that changes shared state stages a `logs` entry inside the same batch or transaction, so a change and its record succeed or fail together.

## Live data

`useCollection` wraps `onSnapshot`, so lists update the moment someone else changes them: a new reservation appears in the owner's queue without a refresh, and stock changes show to shoppers immediately.

## Code splitting

The public home, directory and store pages are in the main bundle. The map, secondary public pages and the entire console are lazy loaded.

## Images

Uploads go to Firebase Storage under `media/{shops|products|offers}/{scope}/`, are downscaled in the browser to 1600 px WebP, and are limited to 5 MB by rules. Anywhere an image is missing or fails to load, the UI draws deterministic generated artwork from the item's name and category so nothing ever looks broken.
