# Caddy Reverse Proxy

This folder contains the Phase 11 Caddy configuration for Hostinger VPS.

## Required Environment

```text
CADDY_ADMIN_EMAIL=admin@example.com
CARD_DOMAIN=card.example.com
DASHBOARD_DOMAIN=dashboard.example.com
```

## Routing

- `CARD_DOMAIN` routes to the card app on port `3000`.
- `DASHBOARD_DOMAIN` routes to the dashboard app on port `3001`.

Caddy handles HTTPS certificates automatically when DNS points at the VPS and
ports 80/443 are open.

