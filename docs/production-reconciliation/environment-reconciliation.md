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

- telephony provider `mock`
- telephony provider mode `disabled`
- live inbound disabled
- outbound disabled
- production calls disabled
- voice runtime provider `none`
- voice agent disabled
- voice test mode enabled
- recording disclosure disabled
- call transfer disabled
- human approval required

Safety notes:

- provider identity alone never authorizes execution
- a real telephony provider identifier is not accepted for the current production
  reconciliation contract
- missing provider credentials are never treated as permission to activate a provider
- production telephony, production voice, and production calling remain disabled in this branch
