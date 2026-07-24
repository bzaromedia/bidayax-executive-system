# Proposed Executive Card Dashboard Route Exceptions

This directory contains a proposed, non-deployed Nginx fragment for the
historical shared-VPS dashboard host.

The canonical production launch model is the dedicated Hostinger VPS with
host-level Caddy, documented in `docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`.
These Nginx files are transitional legacy-target artifacts only. They must not
be applied unless a separate owner decision explicitly authorizes the historical
shared-VPS path.

Insertion point:

- inside the `server` block for `dashboard.theexecutivecard.online`
- above the general dashboard `auth_basic`-protected location handling

Purpose:

- bypass Basic Auth for `/auth/callback`
- bypass Basic Auth for `/api/auth/webhooks/workos`
- bypass Basic Auth for `/api/system/health`
- keep `/api/system/readiness` internal or source-restricted

Validation command:

```bash
nginx -t
```

Rollback:

- restore the prior Executive Card site file
- rerun `nginx -t`
- reload Nginx only if validation passes
