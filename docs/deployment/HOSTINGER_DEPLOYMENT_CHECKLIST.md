# Hostinger Deployment Checklist

Project: The Executive Card™  
Deployment target: Dedicated Hostinger VPS

This checklist is the launch gate for the dedicated-VPS production model.

## 1. Hosting And Access

- [ ] Dedicated VPS purchased and provisioned.
- [ ] Ubuntu 24.04 confirmed.
- [ ] Approved SSH key attached.
- [ ] Hostname assigned.
- [ ] No unrelated workloads installed on the host.

## 2. Directory Layout

- [ ] `/opt/the-executive-card/releases` created.
- [ ] `/opt/the-executive-card/current` managed as a symlink only.
- [ ] `/opt/the-executive-card/shared/env` created.
- [ ] `/opt/the-executive-card/shared/logs` created.
- [ ] `/opt/the-executive-card/shared/backups` created.
- [ ] `/opt/the-executive-card/shared/postgres` created if host-managed storage is used.

## 3. External Environment File

- [ ] `/opt/the-executive-card/shared/env/production.env` created.
- [ ] owner is `root`.
- [ ] mode is `0600`.
- [ ] real values were not committed.
- [ ] communications safety values remain disabled.

## 4. Runtime Alignment

- [ ] Dockerfiles use Node.js 22.17.0.
- [ ] Dockerfiles activate pnpm 11.7.0 deterministically.
- [ ] `pnpm install --frozen-lockfile` succeeds.
- [ ] Docker builds succeed for card and dashboard.

## 5. Compose And Database

- [ ] `docker-compose.hostinger.yml` config validates.
- [ ] `docker-compose.production.yml` config validates.
- [ ] card binds only to `127.0.0.1:3100`.
- [ ] dashboard binds only to `127.0.0.1:3101`.
- [ ] PostgreSQL is not publicly published.
- [ ] one-shot `migrate` profile remains opt-in only.
- [ ] PostgreSQL 17 health check passes.

## 6. Reverse Proxy And TLS

- [ ] host-level Caddy installed.
- [ ] `infrastructure/caddy/the-executive-card.caddy` reviewed.
- [ ] main Caddyfile imports site files safely.
- [ ] apex routes to `127.0.0.1:3100`.
- [ ] `www` redirects permanently to apex.
- [ ] dashboard routes to `127.0.0.1:3101`.
- [ ] WorkOS callback is not blocked.
- [ ] WorkOS webhook is not blocked.
- [ ] TLS validates for apex, `www`, and dashboard.

## 7. Health, Readiness, And Smoke

- [ ] dashboard `/api/system/health` succeeds.
- [ ] dashboard `/api/system/readiness` succeeds after database readiness.
- [ ] card smoke route `/card/ad-garner` succeeds.
- [ ] CSS/static asset checks succeed.
- [ ] no hydration or runtime startup regression is present.

## 8. Backup And Restore

- [ ] daily backup plan approved.
- [ ] mandatory pre-deployment backup plan approved.
- [ ] checksum generation and verification documented.
- [ ] non-production restore rehearsal completed.
- [ ] restore rehearsal evidence recorded.

## 9. Monitoring And Alerting

- [ ] uptime checks defined for apex and dashboard.
- [ ] health/readiness checks defined.
- [ ] container health and restart monitoring defined.
- [ ] PostgreSQL monitoring defined.
- [ ] TLS expiry monitoring defined.
- [ ] communications-gate drift monitoring defined.
- [ ] alert destination approved by owner.

## 10. Final Safety Gates

- [ ] no real secrets in the repository.
- [ ] no production telephony activation.
- [ ] no production voice activation.
- [ ] no production calling activation.
- [ ] no external provider activation.
- [ ] rollback plan approved.
- [ ] DNS cutover plan approved.
- [ ] final deployment approval issued separately.
