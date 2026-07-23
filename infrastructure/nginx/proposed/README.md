# Proposed Executive Card Dashboard Route Exceptions

This directory contains a proposed, non-deployed Nginx fragment for the existing
dashboard host on the shared VPS.

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
