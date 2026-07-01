# Production Executive Cards

Project: The Executive Card  
Owner: BidayaX LLC  
Public URL: https://theexecutivecard.online

## Scope

Recovery Phase B1 adds three real executive cards for internal business use:

| Executive | Role | URL |
| --- | --- | --- |
| A.D Garner | COO / CTO / Founder | https://theexecutivecard.online/card/ad-garner |
| Naimah J. Barnes | CEO | https://theexecutivecard.online/card/naimah-barnes |
| Sean Hall | Executive Management | https://theexecutivecard.online/card/sean-hall |

Sean Hall may later be represented in public marketing, but all three cards are currently operational business cards, not customer proof or public sales claims.

## Production Data Source

Profile data lives in `packages/config/executives/profiles.ts`.

Shared production values:

- Company: BidayaX LLC
- Address: 8 The Green Ste A, Dover, DE 19901
- Phone: +1 (302) 330-5547
- Email: contact@bidayax.com
- Website: https://theexecutivecard.online
- Theme: executive-black-gold

`contact@bidayax.com` must be configured in production DNS/mail before public operational use.

## Card Capabilities

Each card includes:

- public profile route;
- unique slug;
- in-page QR code;
- direct QR image route;
- vCard download route;
- call button;
- email button;
- website button;
- address display;
- share button;
- contact-save action;
- card view, QR scan, call, email, website, vCard, and share event logging;
- SEO metadata;
- OpenGraph metadata;
- responsive mobile and desktop layout.

## Event Ledger

The card app emits these events:

- `card_view`
- `qr_scan`
- `call_click`
- `email_click`
- `website_click`
- `vcard_download`
- `share_click`

The database migration `0009_add_share_click_interaction_event.sql` extends the interaction event enum for share tracking.

## Brand Assets

Production brand mark SVGs are stored in:

- `apps/card/public/brand/`
- `apps/dashboard/public/brand/`
- `packages/design-system/branding/`

The runtime card UI uses design-system tokens and the approved black/gold identity.

## Verification

Run:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrations:verify
```

Card-specific tests live in `apps/card/src/__tests__/production-cards.test.ts`.
