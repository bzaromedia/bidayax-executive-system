# Contributing

The Executive Card is maintained by BidayaX LLC.

## Local Verification

Run these before opening a pull request:

```powershell
pnpm install
pnpm db:migrations:verify
pnpm typecheck
pnpm test
pnpm build
```

## Scope Rules

- Do not implement Phases 14-24 during Recovery Phase 0.
- Do not advertise a package, service, script, or phase unless source exists and verification passes.
- Keep public-facing naming aligned to The Executive Card.
- Keep BidayaX LLC as owner/company attribution where appropriate.
- Do not commit generated artifacts, local stores, or environment files.

## Pull Requests

Each pull request should include:

- summary of changes;
- verification commands run;
- known limitations or blocked checks;
- whether public naming or phase status changed.
