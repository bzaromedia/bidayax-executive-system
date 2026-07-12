# Identity Provider Decision

## Decision

Phase 5 uses WorkOS AuthKit as the reference production identity provider.

## Rationale

WorkOS AuthKit fits this phase because it is organization-oriented, supports users and organization memberships, has hosted authentication, MFA/passkey support, session APIs, webhooks, and a mature Next.js integration path. Official WorkOS docs describe users, organizations, and memberships as first-class concepts and explicitly note that app-specific granular roles can remain in the application database. That matches The Executive Card requirement that WorkOS authenticates users while BidayaX authorizes tenants, roles, cards, and settings permissions internally.

Reference docs:

- WorkOS users and organizations: https://workos.com/docs/authkit/users-organizations
- WorkOS sessions: https://workos.com/docs/authkit/sessions
- WorkOS AuthKit Next.js SDK: https://workos.com/docs/sdks/authkit-nextjs
- WorkOS pricing: https://workos.com/pricing

## Alternatives Considered

| Provider | Strength | Risk For This Phase |
| --- | --- | --- |
| WorkOS AuthKit | B2B organization model, hosted auth, MFA/passkeys, webhooks, sessions | Vendor dependency and paid enterprise features must be monitored |
| Auth0 | Mature OIDC/OAuth and enterprise SSO | Broader platform surface and tenant/org mapping work could slow Phase 5 |
| Clerk | Strong Next.js developer experience | Browser/session abstractions could tempt authorization into client/provider claims |
| Keycloak | Self-hostable and flexible | Operational burden is high for this project stage |

## Boundary

WorkOS is used for authentication only. Internal authorization remains provider-independent and is resolved from:

- `user_identities`
- `identity_provider_accounts`
- `tenant_memberships`
- `card_access_grants`
- permission policy in `@bidayax/identity` and `@bidayax/settings`

Provider organization claims may assist mapping through `identity_provider_tenant_links`, but they do not grant settings access by themselves.
