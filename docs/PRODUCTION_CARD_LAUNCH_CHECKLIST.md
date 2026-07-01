# Production Card Launch Checklist

Project: The Executive Card™  
Owner: BidayaX LLC  
Public URL: https://theexecutivecard.online

## Card Readiness

| Item | Status | Evidence |
| --- | --- | --- |
| A.D Garner production card exists | ready | `packages/config/executives/profiles.ts`, `/card/ad-garner` |
| Naimah J. Barnes production card exists | ready | `packages/config/executives/profiles.ts`, `/card/naimah-barnes` |
| Sean Hall production card exists | ready | `packages/config/executives/profiles.ts`, `/card/sean-hall` |
| QR route exists for each card | ready | `/card/[slug]/qr` |
| vCard route exists for each card | ready | `/card/[slug]/vcard` |
| Call, email, website, save, and share actions exist | ready | `apps/card/src/components/ExecutiveActionBar.tsx` |
| SEO and OpenGraph metadata exist | ready | `apps/card/src/lib/seo.ts`, `apps/card/app/card/[slug]/opengraph-image.tsx` |
| Event logging route exists | ready with database dependency | `apps/card/app/api/events/route.ts` |
| Interaction event schema includes share | ready | `database/migrations/0009_add_share_click_interaction_event.sql` |
| Public claims guard passes | ready | `pnpm verify:public-claims` passed |
| No runtime filler content guard passes | ready | `pnpm verify:no-placeholders` passed |
| Local production card routes render | ready | HTTP 200 for all three local `/card/[slug]` routes |
| Local QR routes return images | ready | HTTP 200, `Content-Type: image/png` for all three local `/card/[slug]/qr` routes |
| Local vCard routes return contact files | ready | HTTP 200, `Content-Type: text/vcard; charset=utf-8` for all three local `/card/[slug]/vcard` routes |

## Deployment Readiness

| Item | Status | Evidence |
| --- | --- | --- |
| `.env.example` exists | ready | `.env.example` |
| `.env.production.example` exists | ready | `.env.production.example` |
| Docker files exist | ready | `infrastructure/docker/` |
| Caddy routing exists | ready | `infrastructure/caddy/Caddyfile` |
| Hostinger deployment guide exists | ready | `infrastructure/hostinger-vps/DEPLOYMENT_GUIDE.md` |
| Health endpoint exists | ready | `apps/dashboard/app/api/system/health/route.ts` |
| Readiness endpoint exists | ready with database dependency | `apps/dashboard/app/api/system/readiness/route.ts` |
| Telephony is disabled by default | ready | `.env.production.example`, `services/telephony` tests |

## Required Before Public Marketing

- Deploy the production card app to https://theexecutivecard.online.
- Configure `DATABASE_URL` and run migrations in the production environment.
- Configure `contact@bidayax.com` DNS/mail delivery.
- Verify the three public card URLs on the deployed domain.
- Validate QR scans and vCard import on iOS, Android, Google Contacts, Apple Contacts, Outlook, and Gmail.
- Confirm the dashboard health/readiness endpoints on the deployed environment.

## Launch Decision

Production card system status: ready for deployment validation.

Marketing website may begin: no.

Reason: the source, build, and local production card system are ready for validation, but public marketing should wait until the production deployment, public URLs, `DATABASE_URL`, and `contact@bidayax.com` DNS/mail setup are verified on the live environment.
