# Live Production Validation Report

Project: The Executive Card  
Phase: Recovery Phase B6 - Live Production Validation  
Report date: 2026-07-02  
Previous deployment report: `docs/deployment/LIVE_DEPLOYMENT_REPORT.md`

## Validation Decision

The live production system passed technical validation for public card delivery, dashboard protection, card assets, download packages, local release gates, SSL, database migration evidence, event persistence evidence, and backup evidence.

Manual phone, contact-app, mail-client, sharing, and social preview checks require owner-owned devices and accounts. Those checks are tracked in `docs/deployment/OWNER_PUBLIC_VALIDATION_CHECKLIST.md`.

## Live Route Validation

Live endpoint checks were run against the public domains after B5 deployment.

| Check | URL | Result | Content type |
| --- | --- | --- | --- |
| Root route | `https://theexecutivecard.online` | `200` | `text/html; charset=utf-8` |
| WWW route | `https://www.theexecutivecard.online` | `200` | `text/html; charset=utf-8` |
| Dashboard without credentials | `https://dashboard.theexecutivecard.online` | `401` | `text/html` |
| A.D Garner card | `https://theexecutivecard.online/card/ad-garner` | `200` | `text/html; charset=utf-8` |
| A.D Garner QR | `https://theexecutivecard.online/card/ad-garner/qr` | `200` | `image/png` |
| A.D Garner vCard | `https://theexecutivecard.online/card/ad-garner/vcard` | `200` | `text/vcard; charset=utf-8` |
| A.D Garner download | `https://theexecutivecard.online/card/ad-garner/download` | `200` | `application/zip` |
| Naimah J. Barnes card | `https://theexecutivecard.online/card/naimah-barnes` | `200` | `text/html; charset=utf-8` |
| Naimah J. Barnes QR | `https://theexecutivecard.online/card/naimah-barnes/qr` | `200` | `image/png` |
| Naimah J. Barnes vCard | `https://theexecutivecard.online/card/naimah-barnes/vcard` | `200` | `text/vcard; charset=utf-8` |
| Naimah J. Barnes download | `https://theexecutivecard.online/card/naimah-barnes/download` | `200` | `application/zip` |
| Sean Hall card | `https://theexecutivecard.online/card/sean-hall` | `200` | `text/html; charset=utf-8` |
| Sean Hall QR | `https://theexecutivecard.online/card/sean-hall/qr` | `200` | `image/png` |
| Sean Hall vCard | `https://theexecutivecard.online/card/sean-hall/vcard` | `200` | `text/vcard; charset=utf-8` |
| Sean Hall download | `https://theexecutivecard.online/card/sean-hall/download` | `200` | `application/zip` |

## Dashboard Validation

Dashboard domain:

- `https://dashboard.theexecutivecard.online`

Results:

- Unauthenticated dashboard access returns `401`.
- B5 authenticated health validation returned `HTTP/2 200` for `https://dashboard.theexecutivecard.online/api/system/health`.
- The dashboard password is owner-held and was not stored in the repository.

## Database And Event Validation

Database migration status is inherited from B5 deployment evidence:

- PostgreSQL container: `the-executive-card-postgres-1`
- Compose project: `the-executive-card`
- All migration files `0001` through `0009` were applied successfully.

Event persistence was validated in B5 by posting a production event to:

- `https://theexecutivecard.online/api/events`

The API returned:

- `eventId`: `1564c37a-a133-4eb4-9bcf-04c28648766b`
- `ok`: `true`

The event was then queried from PostgreSQL with:

- `event_type`: `card_view`
- `executive_slug`: `ad-garner`
- `session_id`: `validation-session-20260702`
- `metadata.source`: `b5_live_validation`

## Backup And Restore Validation

Backup evidence from B5:

- Backup file: `/opt/the-executive-card/backups/the-executive-card-20260702-014505.dump`
- Backup size: `65K`

Restore procedure:

- Restore is documented in `docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`.
- Restore was not executed against production because that would risk replacing live data.
- A non-production restore drill remains an owner operations task before high-traffic launch.

## SSL And Renewal Validation

Certificate evidence from B5:

- Certificate path: `/etc/letsencrypt/live/theexecutivecard.online/fullchain.pem`
- Covered names:
  - `theexecutivecard.online`
  - `www.theexecutivecard.online`
  - `dashboard.theexecutivecard.online`

Renewal evidence:

- Certbot renewal dry-run succeeded after ACME challenge routing was corrected.
- ACME challenge traffic is routed through the dedicated The Executive Card Nginx site.

Reverse proxy reality:

- The initial plan used host-level Caddy.
- The VPS already had Nginx bound to ports `80` and `443` for existing projects.
- To avoid disrupting other projects, production traffic uses a dedicated Nginx site for The Executive Card.
- Caddy is not active in the production request path.

## VPS Isolation Validation

The deployment remained isolated:

- Project path: `/opt/the-executive-card`
- Backup path: `/opt/the-executive-card/backups`
- Compose project: `the-executive-card`
- Card bind: `127.0.0.1:3100`
- Dashboard bind: `127.0.0.1:3101`
- PostgreSQL is reachable only on the project Docker network.
- No unrelated Docker containers were stopped or pruned during deployment.
- No unrelated Nginx site files were intentionally modified.

## Security And Claims Validation

Repository checks:

- No real `POSTGRES_PASSWORD` or `BIDAYAX_IP_HASH_SECRET` values were found in the repository search.
- Public claims verifier passed.
- No inactive product surfaces are advertised as active v1.0 capabilities.
- Telephony remains safety-gated and disabled by default.

Email status:

- Namecheap DNS was corrected by the owner.
- Namecheap Private Email inbox validation still requires owner send/receive testing.
- Current production card profile links still use `contact@bidayax.com`; switching card profile data to product-domain mailboxes is a separate tested change.

## Local Release Gate Results

| Command | Result |
| --- | --- |
| `pnpm verify:public-claims` | Passed |
| `pnpm verify:no-placeholders` | Passed |
| `pnpm verify:design-governance` | Passed |
| `pnpm verify:release-scope` | Passed |
| `pnpm verify:production` | Passed with expected local workstation warning that `DATABASE_URL` is not configured |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test` | Passed |
| `pnpm build` | Passed |

## Owner Validation Required

Codex cannot complete device-owned validation for:

- iPhone QR scan behavior.
- Android QR scan behavior.
- Apple Contacts vCard import.
- Google Contacts vCard import.
- Gmail email-link handling.
- Native phone call link behavior.
- Native share sheet behavior.
- OpenGraph preview rendering in real social or messaging clients.
- Mobile browser visual review.
- Desktop browser visual review.
- Namecheap mailbox send/receive behavior.

These checks are listed in `docs/deployment/OWNER_PUBLIC_VALIDATION_CHECKLIST.md`.

## Remaining Blockers

No technical blockers were found during B6.

## Remaining Warnings

- Owner device validation is still required before public announcement.
- Owner email send/receive validation is still required.
- Non-production restore drill is still recommended before high-traffic launch.
- Production traffic uses Nginx rather than Caddy because Nginx already owns ports `80` and `443` on this VPS.

## Final Status

The live system is technically valid for owner public validation.
