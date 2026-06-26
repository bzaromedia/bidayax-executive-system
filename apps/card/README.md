# BidayaX Card App

Phase 3 creates the first visible product surface: the executive digital business card vertical slice.

Phase 4 adds fail-open interaction event capture behind the card.

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

If the event API or database is unavailable, the card still works.

## Phase Boundaries

This app contains static executive card data, QR code display, vCard export, contact actions, and the Phase 4 event ingestion route only.

It intentionally does not include dashboard analytics, receptionist automation, authentication, admin workflows, payment systems, CRM functionality, intent scoring, contact records, lead records, or recursive improvement automation.
