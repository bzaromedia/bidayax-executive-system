# Monitoring And Alerting

Project: The Executive Card™
Deployment target: Dedicated Hostinger VPS

## Monitoring Scope

Monitor:

- apex uptime
- dashboard uptime
- dashboard health
- dashboard readiness
- card rendering smoke
- dashboard rendering smoke
- CSS/static asset availability
- container health
- container restart counts
- PostgreSQL availability
- CPU
- RAM
- disk
- backup success
- TLS expiry
- authentication failures
- trust verification failures
- communications-gate drift

## Metrics And Log Sources

- Hostinger VPS metrics
- Docker/container state
- Caddy access logs
- Caddy error logs
- application logs
- PostgreSQL logs
- dashboard health/readiness routes

## Alert Conditions

Raise alerts for:

- apex or dashboard unreachable for two consecutive checks
- readiness returning `not_ready` for two consecutive checks
- card smoke failure
- CSS/static asset failure
- unhealthy container state
- repeated container restarts
- PostgreSQL unavailable
- CPU above 80% sustained
- RAM above 85% sustained
- disk above 80% sustained
- missed backup window
- TLS nearing expiry
- repeated authentication failures beyond the approved threshold
- trust verification failures
- communications-gate drift

## Communications-Gate Drift Conditions

The following values must remain unchanged unless a later explicit activation phase approves them:

- `TELEPHONY_PROVIDER=mock`
- `TELEPHONY_PROVIDER_MODE=disabled`
- `VOICE_RUNTIME_PROVIDER=none`
- `VOICE_AGENT_ENABLED=false`
- `LIVE_INBOUND_CALLS_ENABLED=false`
- `OUTBOUND_CALLS_ENABLED=false`
- `ALLOW_PRODUCTION_CALLS=false`
- `REQUIRE_HUMAN_APPROVAL=true`

Any drift from those values is a production-safety alert.

## Alert Destination

No live alert destination is configured in this repository phase.

Owner approval is required before choosing email, chat, paging, or on-call destinations.

## Retention And Redaction

- keep logs and alerts free of secrets
- preserve existing application log redaction
- do not emit raw credentials, tokens, or sensitive evidence into alert payloads

## Test Procedure

Before public launch, test:

- synthetic uptime failure handling
- container restart detection
- backup failure alert path
- TLS warning path
- communications-gate drift detection
