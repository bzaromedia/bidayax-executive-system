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

Safety notes:

- provider identity alone never authorizes execution
- a real telephony provider identifier may exist while runtime remains disabled
- disabled and sandbox-equivalent provider states are classified separately from active runtime states
- missing provider credentials are never treated as permission to activate a provider
- production telephony, production voice, and production calling remain disabled in this branch
