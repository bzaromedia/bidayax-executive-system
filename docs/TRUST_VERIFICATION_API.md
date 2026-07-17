# Trust Verification API

Authenticated internal routes are under `/api/internal/trust/[operation]`. Operations cover artifact verification, trust status, public keys, provenance, audit chains, Merkle evidence, key status/rotation, and revocations.

Permissions are deny-by-default: `trust.verify`, `trust.keys.read`, `trust.keys.manage`, `trust.provenance.read`, `trust.audit.verify`, `trust.merkle.verify`, and `trust.revocations.read`. Tenant scope must match the authenticated session; non-privileged users must supply an assigned card scope. Responses use `no-store` and never include private material or unrestricted artifacts.

