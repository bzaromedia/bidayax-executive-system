# Internal Production Validation

Project: The Executive Card™  
Owner: BidayaX LLC  
Public URL: https://theexecutivecard.online

## Scope

Recovery Phase B2 validates the three internal production executive cards before any public marketing site is built.

| Executive | Route |
| --- | --- |
| A.D Garner | https://theexecutivecard.online/card/ad-garner |
| Naimah J. Barnes | https://theexecutivecard.online/card/naimah-barnes |
| Sean Hall | https://theexecutivecard.online/card/sean-hall |

The local production-build validation used the same route paths on `http://localhost:3000` after `pnpm --filter @bidayax/card build` and `pnpm --filter @bidayax/card start`.

## Validation Matrix

| Requirement | Status | Evidence |
| --- | --- | --- |
| Card route renders | validated locally | HTTP 200 for `/card/ad-garner`, `/card/naimah-barnes`, `/card/sean-hall` |
| QR route returns image | validated locally | HTTP 200, `Content-Type: image/png` for all three `/card/[slug]/qr` routes |
| vCard route returns `.vcf` | validated locally | HTTP 200, `Content-Type: text/vcard; charset=utf-8`, `BEGIN:VCARD` present for all three `/card/[slug]/vcard` routes |
| Call links use +1 (302) 330-5547 | source verified | `packages/config/executives/profiles.ts`, `apps/card/src/components/ExecutiveActionBar.tsx` |
| Email links use contact@theexecutivecard.com | source verified | `packages/config/executives/profiles.ts`, `apps/card/src/components/ExecutiveActionGrid.tsx` |
| Website links use https://bidayax.com | source verified | `packages/config/executives/profiles.ts`, `apps/card/src/components/ExecutiveActionGrid.tsx` |
| Share actions work safely | source and test verified | `apps/card/src/components/ExecutiveShareButton.tsx`, `apps/card/src/__tests__/production-cards.test.ts` |
| SEO metadata exists | source and test verified | `apps/card/src/lib/seo.ts`, `apps/card/app/card/[slug]/page.tsx` |
| OpenGraph metadata exists | source verified | `apps/card/app/card/[slug]/opengraph-image.tsx` |
| Event logging works | route validated; database persistence requires `DATABASE_URL` | `POST /api/events` returned safe `503 event_store_unavailable` locally because `DATABASE_URL` is not configured |
| Mobile layout is usable | source and build verified | `apps/card/src/components/ExecutiveCardProfile.tsx`, `apps/card/src/styles/card.css` |
| Desktop layout is usable | source and build verified | `apps/card/src/components/ExecutiveCardProfile.tsx`, `apps/card/src/styles/card.css` |
| No profile filler data exists | test verified | `apps/card/src/__tests__/production-cards.test.ts` |
| No unsupported public claims exist | release script verified | `pnpm verify:public-claims` passed |

## Local Route Results

| Slug | Card route | QR route | vCard route | Required values |
| --- | --- | --- | --- | --- |
| `ad-garner` | 200 | 200, `image/png` | 200, `text/vcard; charset=utf-8` | phone, email, website, title, and OpenGraph metadata present |
| `naimah-barnes` | 200 | 200, `image/png` | 200, `text/vcard; charset=utf-8` | phone, email, website, title, and OpenGraph metadata present |
| `sean-hall` | 200 | 200, `image/png` | 200, `text/vcard; charset=utf-8` | phone, email, website, title, and OpenGraph metadata present |

## Production Data

All three cards use:

- Phone: +1 (302) 330-5547
- Email: contact@theexecutivecard.com
- Website action: https://bidayax.com
- Address: 8 The Green Ste A, Dover, DE 19901

`contact@theexecutivecard.com` must be configured in DNS/mail before public operational use.

## External Validation Still Required

- Confirm live production deployment responds at https://theexecutivecard.online.
- Confirm DNS points to the Hostinger VPS.
- Confirm HTTPS certificate issuance.
- Confirm `contact@theexecutivecard.com` mailbox delivery.
- Confirm Apple Contacts, Google Contacts, Android Contacts, Outlook, Gmail, SMS sharing, and mobile browser behavior with deployed URLs.
