# Infrastructure Discovery

Project: The Executive Card™  
Production architecture status: DEDICATED VPS PLANNING BASELINE

## Current Decision

- The existing shared KVM 8 VPS is not the approved final public production host.
- The approved production target is a new dedicated Hostinger VPS.
- Production runtime remains Node.js 22 with pnpm 11.7.0.
- Production secrets move to `/opt/the-executive-card/shared/env/production.env`.
- Deployment moves to immutable releases rather than a mutable live repository checkout.

## Target Topology

- Ubuntu 24.04
- host-level Caddy
- Docker Compose stack: `postgres`, `migrate`, `card`, `dashboard`
- card loopback bind: `127.0.0.1:3100`
- dashboard loopback bind: `127.0.0.1:3101`
- PostgreSQL internal-only on the Docker network
- systemd wrapper for the active immutable release

## Canonical Paths

| Path | Purpose |
| --- | --- |
| `/opt/the-executive-card/releases/<git-sha>` | immutable release payload |
| `/opt/the-executive-card/current` | active release symlink |
| `/opt/the-executive-card/shared/env/production.env` | server-only production secrets |
| `/opt/the-executive-card/shared/logs` | application and proxy logs |
| `/opt/the-executive-card/shared/backups` | backup artifacts |
| `/etc/caddy/sites-enabled/the-executive-card.caddy` | active host-level Caddy site |

## Approved Domains

- `https://theexecutivecard.online`
- `https://www.theexecutivecard.online`
- `https://dashboard.theexecutivecard.online`

## Supported Operational Checks

- dashboard health: `/api/system/health`
- dashboard readiness: `/api/system/readiness`
- card smoke route: `/card/ad-garner`

## Historical Note

The shared-host deployment evidence from July 2026 remains historical context only. It is not the source of truth for the dedicated-VPS production launch architecture.
