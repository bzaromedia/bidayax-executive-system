# Executive Card Production Reconciliation Package

This package converts the approved production reconciliation plan into repository-owned implementation artifacts.

It is planning, validation, and operator-guidance machinery only.

It does not authorize or perform:

- VPS mutation
- migration execution
- image builds on production
- container replacement
- Nginx changes
- wallet implementation

Primary components:

- `packages/database-reconciliation/`
- `scripts/production-reconciliation/`
- `infrastructure/nginx/proposed/`
- this documentation set

`infrastructure/nginx/proposed/` is a transitional legacy-target artifact for the
historical shared-VPS Nginx path. The current canonical production deployment
model remains the dedicated Hostinger VPS with host-level Caddy.

Generated evidence under `artifacts/production-reconciliation/` is ignored by
Git and must be treated as local/operator evidence only. It must not contain
secrets.
