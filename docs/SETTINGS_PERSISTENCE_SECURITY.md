# Settings Persistence Security

## Scope

This document records Phase 3G security findings for the Settings Persistence Layer.

## Tenant Isolation

All repository read paths for tenant-owned records must include `tenantId`. Phase 3G hardened these access patterns:

- brand asset lookup requires `tenantId` and `assetId`
- executive card profile lookup requires `tenantId` and `cardId`
- card settings version lookup requires `tenantId`, `cardId`, and `versionId`
- audit event lookup requires `tenantId`, `cardId`, and `eventId`
- idempotency lookup requires `tenantId`, `cardId`, operation, and idempotency key

Upsert paths reject attempts to reassign a globally unique asset or card ID to a different tenant.

## Sensitive Data

The persistence layer must not store provider secrets, API keys, database credentials, authentication tokens, raw call recordings, or private environment variables.

Fields that may contain personal data:

- tenant owner email
- executive phone and email
- executive location
- brand asset alternate text and storage references
- audit actor metadata
- audit IP address and user agent when supplied
- receptionist escalation contact values

Retention policy is not implemented in Phase 3G. Do not claim regulatory compliance without separate retention, export, deletion, and legal-review work.

## Audit Metadata

Audit metadata is JSON. Callers must sanitize metadata before persistence. The repository enforces append-only persistence, but it does not classify every possible metadata field.

## Error Handling

Repository conflict errors describe ownership or immutability conflicts without exposing SQL, secrets, or credentials.

## Provider Safety

Phase 3G does not add telephony, email, calendar, or AI provider credentials. Production calls remain disabled by default.
