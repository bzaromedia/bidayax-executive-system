# The Executive Card App

The card app is the public executive identity surface for The Executive Card. It presents production executive profiles, QR engagement, vCard export, contact actions, share actions, SEO/OpenGraph metadata, and non-blocking interaction capture.

The app is one part of the Executive Identity Intelligence Platform. It is not the whole platform and should not be positioned as merely a digital business card.

## Routes

- `/card/ad-garner`
- `/card/naimah-barnes`
- `/card/sean-hall`

## Run

```bash
pnpm --filter @bidayax/card dev
```

## Validate

```bash
pnpm --filter @bidayax/card typecheck
pnpm --filter @bidayax/card lint
pnpm --filter @bidayax/card build
```

## Phase 4 Event Ledger

The card emits non-blocking interaction events to `POST /api/events`.

Required for persistence:

```bash
DATABASE_URL=postgres://...
BIDAYAX_IP_HASH_SECRET=replace-with-production-secret
```

Emitted events:

- `qr_scan` when a card opens with `entry=qr`.
- `card_view` when a card route loads.
- `vcard_download` when vCard is clicked.
- `call_click` when Call is clicked.
- `email_click` when Email is clicked.
- `website_click` when Website is clicked.
- `share_click` when Share is clicked.

If the event API or database is unavailable, the card still works.

## Phase Boundaries

This app contains structured executive profile data, QR display, QR image route, vCard export, contact actions, share actions, SEO/OpenGraph metadata, and the Phase 4 event ingestion route.

It intentionally does not include dashboard analytics, receptionist automation, authentication, admin workflows, payment systems, CRM functionality, intent scoring, contact records, lead records, or recursive improvement automation.
