# Production Card Launch Checklist

The Executive Card v1.0 production card release includes implemented, tested, production-buildable card capabilities and queued internal workflow handling.

## Required Software Checks

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm db:migrations:verify`
- `pnpm verify:design-governance`
- `pnpm verify:public-claims`
- `pnpm verify:release-scope`
- `pnpm verify:production`
- `pnpm verify:no-placeholders`

## Required Live Checks

- Public card routes return 200.
- QR routes return valid PNG images.
- vCard routes return valid contact files.
- Download routes return isolated ZIP packages.
- Dashboard remains protected.
- PostgreSQL writes event-ledger and receptionist workflow records.
- Backups and restore procedure remain documented.
- Provider dispatch is treated as inactive until environment values and safety flags are configured and tested.

## Next Phase Boundary

The cryptographic layer may begin after this UX and receptionist workflow phase passes validation and is redeployed successfully.
