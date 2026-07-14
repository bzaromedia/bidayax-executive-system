# Deployment Model

## Purpose

This document defines the intended deployment direction. Phase 1 does not implement deployment, Dockerfiles, Caddy configuration, CI, environments, or hosting automation.

## Intended Runtime Shape

Future deployment should support:

- Public card app.
- Executive dashboard app.
- Receptionist console app.
- API service.
- Event ledger worker or service.
- Intent scoring service or module.
- Receptionist workflow service.
- Notification worker.
- PostgreSQL database.
- Optional Redis only when justified.

## Intended Platform

The preferred deployment direction is:

- Docker for packaging.
- Caddy for reverse proxy and TLS.
- Hostinger VPS for initial hosting.
- PostgreSQL for durable storage.
- Environment-specific configuration.

## Environments

Future environments should include:

- Local development.
- Preview or staging.
- Production.

Each environment should define:

- Domain.
- Secrets.
- Database.
- Logging.
- Backup policy.
- Observability.
- Access controls.

## Monorepo Build Direction

The intended monorepo tooling is:

- pnpm workspaces.
- TurboRepo task orchestration.
- Shared TypeScript configuration.
- Shared lint and formatting configuration.
- App-specific build outputs.
- Package-level boundaries.

This tooling is not installed in Phase 1.

## Deployment Principles

- Deploy the simplest working vertical slice first.
- Do not add orchestration complexity before traffic requires it.
- Use explicit environment variables.
- Keep secrets out of source control.
- Prefer reproducible builds.
- Make health checks visible.
- Make rollback possible.
- Back up production data before risky changes.

## Observability Direction

Future production deployment should expose:

- Request logs.
- Error logs.
- Job logs.
- Event ingestion counts.
- Scoring outcomes.
- Follow-up outcomes.
- Receptionist workflow outcomes.
- Latency for key flows.
- Uptime and health checks.

## Non-Implementation Note

The `infrastructure` folders are reserved for future Docker, Caddy, and Hostinger VPS configuration. They contain no deployment implementation in Phase 1.

## Phase 5 Identity Deployment Addendum

Phase 5 requires production WorkOS/AuthKit configuration before settings login can operate in production. Missing mandatory identity configuration causes identity routes to fail closed.

Required deployment actions:

- Apply migration `0015_create_identity_provider_integration.sql` after the Phase 2-4H settings migrations.
- Configure WorkOS AuthKit application, callback URL, logout return, and webhook URL.
- Populate environment variables through the deployment secret manager only.
- Create internal tenant memberships and card grants before user access is expected.
- Run `pnpm test:settings-persistence:postgres` against a disposable database before merge/release.
- Keep production calling disabled and do not configure telephony providers.

## Phase 7G Telephony Deployment Note

`TELEPHONY_PROVIDER_MODE=sandbox` is for non-production testing only and requires `TELEPHONY_SANDBOX_WEBHOOK_SECRET` with a strong test value. Production deployments must keep production calling disabled. `TELEPHONY_PROVIDER_MODE=production` remains blocked until a future controlled activation phase.

## Phase 8 Deployment Note

No production credentials are required for the Phase 8 runtime foundation. Future STT/TTS provider credentials must not be configured until a provider-specific phase defines verification, retention, redaction, and kill-switch controls.
