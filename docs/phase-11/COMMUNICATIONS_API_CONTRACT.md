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

- every command is tenant-scoped
- card scope is explicit where applicable
- commands are idempotent
- commands are auditable
- commands are safe to reject without external side effects
- transport selection is internal, not caller-controlled
- no API command directly selects a provider
