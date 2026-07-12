# Identity Data Model

Migration `0015_create_identity_provider_integration.sql` adds the Phase 5 identity persistence layer.

## Tables

- `user_identities`: internal user records mapped from verified WorkOS subjects.
- `identity_provider_accounts`: provider account mapping without provider secrets or access tokens.
- `identity_provider_tenant_links`: maps WorkOS organization IDs to internal tenants.
- `tenant_memberships`: internal role source of truth.
- `card_access_grants`: explicit card-level permissions for non-privileged users.
- `application_sessions`: hashed, opaque, revocable application sessions.
- `identity_oauth_transactions`: hashed OAuth state and encrypted PKCE verifier for one-time login callback processing.
- `identity_audit_events`: append-only sanitized security events.
- `identity_webhook_receipts`: provider webhook replay protection.

## Database Guarantees

- Unique provider subject per provider.
- Unique normalized email.
- Tenant-scoped membership uniqueness.
- Card grants require a card that belongs to the same tenant.
- Sessions require a valid internal user and tenant membership at creation.
- Expired or revoked sessions are ignored by lookup logic.
- Audit events and webhook receipts are append-only.
- Webhook receipts are unique by provider event ID.

## Personal Data

Email, display name, avatar URL, user-agent-derived audit metadata, and IP-derived audit metadata may be personal data. Retention and export policy must be defined before broad production launch. No legal or regulatory compliance certification is claimed by this implementation.
