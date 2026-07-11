# Settings Authorization Model

Settings authorization is tenant-aware and least-privilege. The implementation lives in `packages/settings/src/settings-authorization.ts`.

## Roles

- `administrator`: full tenant-scoped settings access, including publish and asset writes.
- `executive`: read, update, preview, and history access for assigned cards only.
- `viewer`: read and history access only.
- `system`: internal read, preview, publish, and history access for audited workflows.

## Tenant Isolation

Every decision checks that the actor tenant matches the resource tenant. Executive users must also be assigned to the requested `cardId`. Knowing another tenant's card ID, version ID, asset ID, or slug must not grant access.

## Current Dashboard Adapter

Until a production identity provider is integrated, the dashboard route helper reads temporary request headers for testability:

- `x-tenant-id`
- `x-actor-id`
- `x-actor-name`
- `x-settings-role`
- `x-card-ids`

In production, missing role information defaults to viewer behavior. This is not a replacement for final authentication middleware.

## Audit Actor

Every authorization decision produces an audit actor shape compatible with settings audit events.
