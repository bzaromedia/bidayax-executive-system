# Environment Reconciliation

The validator works on variable names and safe semantic states only.

It never prints secret values.

Tracked groups:

- WorkOS
- identity
- session
- CSRF
- URLs
- PostgreSQL
- health/readiness
- communications
- telephony
- voice
- future wallet reservations

Mandatory production safety assertions:

- telephony provider mode disabled or sandbox-equivalent
- live inbound disabled
- outbound disabled
- production calls disabled
- voice runtime disabled
- call transfer disabled
- human approval required
