# Communications API Contract

## Boundary

The Communications API is channel-neutral. Applications submit commands to this boundary; they do not call transport adapters directly.

## Required Commands

- request callback
- cancel callback
- schedule communication
- initiate communication
- accept inbound communication event
- escalate to human
- suppress communication
- release suppression
- evaluate consent
- evaluate business hours
- evaluate routing
- query communication status
- terminate communication
- apply tenant kill switch
- apply platform kill switch

## API Rules

- every command resolves the authenticated principal on the server
- caller-supplied tenant, card, role, and permission claims are non-authoritative
- every command is tenant-scoped
- card scope is explicit where applicable
- tenant membership is required for tenant-scoped commands
- card grants are required for card-scoped commands
- command-specific permissions are required for sensitive actions
- commands are idempotent
- commands are auditable
- commands are safe to reject without external side effects
- transport selection is internal, not caller-controlled
- no API command directly selects a provider

## Sensitive Command Authorization

- Suppression release requires an explicitly authorized role, reason, and audit
  evidence.
- Tenant kill switches require an authorized tenant administrator role and
  durable audit evidence.
- Platform kill switches require a platform administrator or BidayaX LLC owner
  delegate.
- Cross-tenant, cross-card, forged-scope, insufficient-role, suppression-release,
  and platform-kill-switch attempts must fail closed.
