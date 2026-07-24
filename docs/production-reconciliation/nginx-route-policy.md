# Nginx Route Policy

This policy applies only to the historical shared-VPS Nginx route exception
proposal in `infrastructure/nginx/proposed/`.

The canonical production launch model is host-level Caddy on the dedicated
Hostinger VPS. Do not apply this Nginx fragment unless a separate owner decision
explicitly authorizes the legacy shared-VPS path.

Dashboard UI may remain behind Basic Auth during reconciliation.

Required exceptions:

- `/auth/callback`
- `/api/auth/webhooks/workos`
- `/api/system/health`

Preferred restricted handling:

- `/api/system/readiness`

See:

- `infrastructure/nginx/proposed/the-executive-card-dashboard.routes.conf`

The fragment overwrites `X-Forwarded-For` from `$remote_addr` at the trusted
proxy boundary so caller-supplied forwarding headers do not control application
or WorkOS IP metadata.

Insertion point:

- inside the dashboard server block
- above the normal Basic Auth protected routing
