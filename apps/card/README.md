# BidayaX Card App

Phase 3 creates the first visible product surface: the executive digital business card vertical slice.

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

## Phase 3 Boundaries

This app contains static executive card data, QR code display, vCard export, and contact actions only.

It intentionally does not include dashboard analytics, backend APIs, database logic, receptionist automation, authentication, admin workflows, payment systems, CRM functionality, or recursive improvement automation.
