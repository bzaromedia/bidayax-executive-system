# Identity Provider Rollback

## Pre-Production Rollback

If Phase 5 has not stored meaningful live identity data, the application may be rolled back to the previous release and migration `0015` tables may be dropped only after a database backup or disposable environment confirmation.

## Post-Production Rollback

If identity data exists, do not drop Phase 5 identity tables without export and retention review. Tables may contain login evidence, user identities, tenant memberships, card grants, active session hashes, and security audit events.

Required steps:

1. Disable new login traffic at the application/router layer.
2. Export identity tables and audit evidence.
3. Revoke active application sessions.
4. Roll back application code.
5. Preserve audit and webhook evidence according to retention policy.
6. Verify settings APIs fail closed or use the approved previous authentication path.

Rollback cannot restore data generated after the backup point.
