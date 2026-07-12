# Identity Provider Operations

## WorkOS Setup Checklist

1. Create or select the WorkOS production environment.
2. Configure the AuthKit application.
3. Register callback URL: `/auth/callback` on the dashboard origin.
4. Register logout/return origins for the dashboard origin.
5. Configure MFA/passkeys according to launch policy.
6. Configure webhook delivery to `/api/auth/webhooks/workos`.
7. Store credentials only in deployment environment variables.
8. Create internal `identity_provider_tenant_links` rows mapping WorkOS organizations to BidayaX tenants.
9. Create internal `tenant_memberships` and `card_access_grants` rows for authorized users.

## Rotation

- Rotate `WORKOS_API_KEY` through deployment environment management.
- Rotate `WORKOS_WEBHOOK_SECRET` and verify webhook delivery.
- Rotate `IDENTITY_TRANSACTION_ENCRYPTION_KEY` only with a plan for active login transactions, because it decrypts pending PKCE verifiers.
- Session token hashes do not require key rotation because raw session tokens are never persisted.

## Incident Response

- Revoke affected sessions in `application_sessions`.
- Revoke tenant memberships or card grants as appropriate.
- Disable compromised `user_identities`.
- Rotate provider and webhook secrets if exposure is suspected.
- Preserve `identity_audit_events` and `identity_webhook_receipts` as evidence.
