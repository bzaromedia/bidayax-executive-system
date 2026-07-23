# Nginx Route Policy

Dashboard UI may remain behind Basic Auth during reconciliation.

Required exceptions:

- `/auth/callback`
- `/api/auth/webhooks/workos`
- `/api/system/health`

Preferred restricted handling:

- `/api/system/readiness`

See:

- `infrastructure/nginx/proposed/the-executive-card-dashboard.routes.conf`

Insertion point:

- inside the dashboard server block
- above the normal Basic Auth protected routing
