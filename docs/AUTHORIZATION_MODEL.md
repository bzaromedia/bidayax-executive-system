# Authorization Model

Settings authorization is tenant-aware, least-privilege, and deny-by-default. Phase 5 separates authentication from business authorization:

- WorkOS AuthKit authenticates the user.
- BidayaX internal records authorize tenant, role, card, and permission scope.

The reusable settings decision engine remains in `packages/settings/src/settings-authorization.ts`. Phase 5 identity authorization and session resolution live in `packages/identity/src/authorization.ts`, `packages/identity/src/session.ts`, and dashboard identity runtime code.

## Roles

Phase 5 supports these internal membership roles:

- `tenant_owner`: full tenant settings, members, sessions, audit, asset, receptionist, preview, and publish access.
- `tenant_admin`: full tenant settings operations except ownership transfer semantics.
- `executive`: assigned-card access according to explicit card grants and role permissions.
- `settings_editor`: draft/edit/preview access; publish requires explicit permission.
- `receptionist_manager`: receptionist configuration and preview access where granted.
- `viewer`: read-only settings and audit visibility where granted.

Legacy Phase 4 roles remain mapped for compatibility where the settings package consumes existing test fixtures, but production dashboard settings routes resolve Phase 5 roles from internal identity records.

## Permission Evaluation

Authorization is computed from:

1. Verified WorkOS provider identity.
2. Internal `user_identities` record.
3. Active `tenant_memberships` record.
4. Active `card_access_grants` records.
5. Deny-by-default role/permission policy.

Privileged tenant roles can operate on tenant cards. Non-privileged users must have explicit card grants with the required permission.

## Tenant Isolation

Every authorization context is scoped to one internal `tenantId`. Card access grants are constrained by `(card_id, tenant_id)` so a card cannot be paired with a different tenant. Settings API routes do not accept tenant, role, permissions, or card IDs from browser-controlled headers as authoritative identity evidence.

## Session Context

Production settings identity is now derived from the `bidayax_identity_session` HttpOnly cookie. The cookie stores an opaque random session token only. The database stores a hash of that token and resolves internal identity, membership, role, and grants server-side.

The previous Phase 4 signed settings-token issuance path is no longer the production identity mechanism.

## Failure Modes

- Missing/invalid/expired/revoked session: HTTP 401 `unauthenticated`.
- Active session without required tenant/card permission: HTTP 403 `authorization_failed`.
- Missing identity provider configuration in production routes: HTTP 503 `identity_unavailable`.

## Audit Actor

Every resolved settings context includes an audit actor derived from internal identity records. Audit metadata must be sanitized and must never include raw cookies, provider tokens, secrets, or authorization headers.
