# Information Required From Owner

Project: The Executive Card™  
Deployment target: Hostinger VPS  
DNS and email provider: Namecheap

## Deployment Readiness Decision

READY FOR HOSTINGER CONFIGURATION

The owner has supplied the Hostinger IPv4 address, Hostinger OS/version, Caddy runtime choice, DNS provider, email provider, DMARC policy, PostgreSQL plan, dashboard exposure policy, and production secret values out-of-band.

Real secrets are intentionally not committed to the repository.

## Required Owner Inputs

- [x] VPS public IP: `187.124.251.190`.
- [x] Hostinger OS/version: Ubuntu 24.04 with Docker.
- [x] `POSTGRES_PASSWORD`: supplied out-of-band; do not commit.
- [x] `BIDAYAX_IP_HASH_SECRET`: supplied out-of-band; do not commit.
- [ ] Exact full Namecheap DKIM TXT value after mailbox/DKIM creation.

## Not Required For RC1

The repository does not currently require these owner inputs for RC1:

- Redis endpoint.
- Object storage bucket.
- SMTP credentials for application-sent email.
- IMAP credentials.
- Stripe credentials.
- Lemon Squeezy credentials.
- PostHog credentials.
- NextAuth secret.
- Public marketing application configuration.

## Next Step

Copy the exact DKIM value from Namecheap Private Email, then proceed to Hostinger configuration using `docs/deployment/PRODUCTION_DEPLOYMENT_RUNBOOK.md`.

During live deployment, keep this project isolated under `/opt/the-executive-card`, use Docker Compose project name `the-executive-card`, and use localhost ports `3100` and `3101` so other VPS projects are not affected.
