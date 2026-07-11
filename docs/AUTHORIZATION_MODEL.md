# Settings Authorization Model

Settings authorization is tenant-aware and least-privilege. The reusable decision engine lives in `packages/settings/src/settings-authorization.ts`; trusted claim validation lives in `packages/settings/src/settings-auth-claims.ts`.

## Roles

- `administrator`: full tenant-scoped settings access, including publish and asset writes.
- `executive`: read, update, preview, and history access for assigned cards only.
- `viewer`: read and history access only.
- `system`: internal read, preview, publish, and history access for audited workflows.

## Tenant Isolation

Every decision checks that the actor tenant matches the resource tenant. Executive users must also be assigned to the requested `cardId`. Knowing another tenant's card ID, version ID, asset ID, or slug must not grant access.

## Trusted Session Context

Settings routes no longer trust tenant, role, actor, or card assignment from plain request headers. Production settings identity is derived from trusted server-side session context using a signed settings token.

Supported token carriers:

- `bidayax_settings_session` cookie
- `Authorization: Bearer <signed-settings-token>`

Production requires `SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET`. Without it, settings routes fail closed. Local development may use a non-production fallback administrator context scoped to the requested source-of-truth card tenant only.

## Header Override Protection

The following headers are ignored for settings identity:

- `x-tenant-id`
- `x-settings-role`
- `x-actor-id`
- `x-actor-name`
- `x-card-ids`

Tests verify signed claims win over those headers.

## Audit Actor

Every authorization decision produces an audit actor shape compatible with settings audit events.
