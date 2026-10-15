# Rebuild plan

This is the plan the rebuild followed, written after the audit in [AUDIT.md](AUDIT.md) and the product decisions recorded there.

## Goals

1. Fix everything in the audit that is broken or exploitable (P0 and P1) and most of P2.
2. Redesign the interface so it looks like a real premium mall brand, not a template.
3. Rebuild the backend on the same Firebase project with real roles, rules, storage and an audit trail.
4. Make every feature work end to end and prove it with tests.

## Phases

| # | Phase | Outcome | Proof |
|---|-------|---------|-------|
| 0 | Audit | 30 findings with severity, scope decisions with the owner | docs/AUDIT.md |
| 1 | Foundations | Vite, React, Tailwind, ESLint, design tokens (light and dark), fonts, icons | `npm run build`, `npm run lint` |
| 2 | Backend hardening | Rules for Firestore and Storage, indexes, hosting headers, emulator config | tests/rules (44 tests) |
| 3 | Data layer | One service per collection, validation shared with the UI, audit entries written in the same batch or transaction | unit tests and e2e |
| 4 | Design system | Buttons, fields, modal and drawer with focus trap, toasts, confirm dialogs, stars, tabs, generated art | axe scans clean |
| 5 | Public site | Home, directory, store page, floor map, offers and events, visit info, favourites, reservations, accounts | e2e |
| 6 | Console | Overview, stores, products, reservations, offers, reviews, people, audit log, settings, with role scoping | e2e |
| 7 | Seed and demo | Fictional Indian mall: 33 stores, 132 products, reviews, offers, events, reservations in every state | `npm run seed` |
| 8 | Verification | Unit, rules and browser tests, accessibility scan, mobile and dark checks | all green |
| 9 | Documentation | README, architecture, security, migration, CI workflow | docs/ |

## Design direction

Editorial luxury. Warm paper background, deep ink, one brass accent. Instrument Serif for display type and Inter for everything else. Arches (the logo motif) appear in the hero, the empty states and the footer. Generous whitespace, large type, quiet motion that respects reduced motion settings. No emoji icons, no gradients as decoration, no dashes in copy.

Dark mode is tuned, not inverted: surfaces stay warm, the accent shifts lighter, and text keeps a 4.5:1 contrast ratio or better (checked with axe).

## Decisions that shaped the build

- No payments. Reservations are paid in store, which avoids a payment provider and server code.
- No Cloud Functions. Everything runs on rules and transactions so the free plan is enough. The known gaps this leaves are listed in SECURITY.md with the function that would close each one.
- Stock is held when a store confirms, not when a shopper asks. That keeps shoppers from draining stock without any server code.
- Generated artwork instead of stock photography. Photos can be uploaded at any time and replace the artwork automatically.

## Out of scope for this pass

Payments, push notifications, multi language support, a native app, and a visual floor plan editor (floor layouts are defined in code).
