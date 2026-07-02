# Production Go/No-Go

Project: The Executive Card  
Phase: Recovery Phase B6 - Live Production Validation  
Decision date: 2026-07-02

## Decision

READY AFTER OWNER DEVICE VALIDATION

## Basis

The deployed production system passed B6 technical validation:

- Root route returns `200`.
- `www` route returns `200`.
- Dashboard requires basic authentication.
- Dashboard health was validated with authentication during B5.
- All three production cards return `200`.
- QR routes for all three cards return `image/png`.
- vCard routes for all three cards return `text/vcard`.
- Download routes for all three cards return `application/zip`.
- Event persistence to PostgreSQL was proven in B5 with a real production event and database query.
- Production backup exists under `/opt/the-executive-card/backups`.
- SSL certificate covers apex, `www`, and dashboard domains.
- Certbot renewal dry-run passed after ACME routing correction.
- Card and dashboard containers use dedicated loopback ports `3100` and `3101`.
- Deployment remained isolated under `/opt/the-executive-card`.
- No unrelated VPS project was intentionally modified.
- Repository release gates passed.

## Local Command Results

| Command | Result |
| --- | --- |
| `pnpm verify:public-claims` | Passed |
| `pnpm verify:no-placeholders` | Passed |
| `pnpm verify:design-governance` | Passed |
| `pnpm verify:release-scope` | Passed |
| `pnpm verify:production` | Passed with expected local workstation warning for unset `DATABASE_URL` |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test` | Passed |
| `pnpm build` | Passed |

## Technical Blockers

None.

## Owner Validation Items

The following are not engineering blockers, but they must be completed before a public announcement:

- iPhone QR scan.
- Android QR scan.
- Apple Contacts vCard import.
- Google Contacts vCard import.
- Gmail email-link behavior.
- Phone call link behavior.
- Native share sheet behavior.
- OpenGraph preview in real clients.
- Mobile browser visual review.
- Desktop browser visual review.
- Namecheap mailbox send/receive validation.
- Non-production restore drill.

The detailed checklist is in `docs/deployment/OWNER_PUBLIC_VALIDATION_CHECKLIST.md`.

## Marketing Decision

Marketing may begin after owner device and mailbox validation is completed with no launch-blocking issues.

Do not start public marketing work before the owner checklist is completed.
