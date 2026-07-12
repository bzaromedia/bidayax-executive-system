CREATE TABLE IF NOT EXISTS user_identities (
  user_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider = 'workos'),
  provider_subject TEXT NOT NULL,
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  last_authenticated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (provider, provider_subject),
  UNIQUE (normalized_email)
);

CREATE TABLE IF NOT EXISTS identity_provider_accounts (
  provider_account_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_identities(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider = 'workos'),
  provider_subject TEXT NOT NULL,
  provider_tenant_id TEXT,
  provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (provider, provider_subject)
);

CREATE TABLE IF NOT EXISTS identity_provider_tenant_links (
  provider TEXT NOT NULL CHECK (provider = 'workos'),
  provider_tenant_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_tenant_id),
  UNIQUE (provider, tenant_id)
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  membership_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user_identities(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (
    role IN (
      'tenant_owner',
      'tenant_admin',
      'executive',
      'settings_editor',
      'receptionist_manager',
      'viewer'
    )
  ),
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  UNIQUE (tenant_id, user_id),
  CHECK (
    (status = 'active' AND revoked_at IS NULL)
    OR (status = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_executive_card_profiles_card_tenant
  ON executive_card_profiles(card_id, tenant_id);

CREATE TABLE IF NOT EXISTS card_access_grants (
  grant_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission_set JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, user_id)
    REFERENCES tenant_memberships(tenant_id, user_id)
    ON DELETE CASCADE,
  UNIQUE (tenant_id, card_id, user_id),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS application_sessions (
  session_id TEXT PRIMARY KEY,
  session_token_hash TEXT NOT NULL UNIQUE,
  csrf_token_hash TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider = 'workos'),
  provider_session_id TEXT,
  authentication_method TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  idle_expires_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  rotated_from_session_id TEXT REFERENCES application_sessions(session_id),
  FOREIGN KEY (tenant_id, user_id)
    REFERENCES tenant_memberships(tenant_id, user_id)
    ON DELETE CASCADE,
  CHECK (idle_expires_at > created_at),
  CHECK (absolute_expires_at >= idle_expires_at)
);

CREATE TABLE IF NOT EXISTS identity_oauth_transactions (
  transaction_id TEXT PRIMARY KEY,
  transaction_token_hash TEXT NOT NULL UNIQUE,
  state_hash TEXT NOT NULL UNIQUE,
  nonce_hash TEXT NOT NULL,
  code_verifier_ciphertext TEXT NOT NULL,
  return_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);

CREATE TABLE IF NOT EXISTS identity_audit_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT REFERENCES user_identities(user_id) ON DELETE SET NULL,
  tenant_id TEXT REFERENCES tenants(tenant_id) ON DELETE SET NULL,
  session_id TEXT REFERENCES application_sessions(session_id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider = 'workos'),
  occurred_at TIMESTAMPTZ NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('succeeded', 'failed', 'denied')),
  reason_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS identity_webhook_receipts (
  provider TEXT NOT NULL CHECK (provider = 'workos'),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  payload_hash TEXT NOT NULL,
  PRIMARY KEY (provider, provider_event_id)
);

CREATE OR REPLACE FUNCTION enforce_active_identity_session()
RETURNS TRIGGER AS $$
DECLARE
  identity_status TEXT;
  membership_status TEXT;
  membership_revoked_at TIMESTAMPTZ;
BEGIN
  SELECT status INTO identity_status
    FROM user_identities
   WHERE user_id = NEW.user_id;

  SELECT status, revoked_at
    INTO membership_status, membership_revoked_at
    FROM tenant_memberships
   WHERE tenant_id = NEW.tenant_id
     AND user_id = NEW.user_id;

  IF identity_status <> 'active' THEN
    RAISE EXCEPTION 'application session requires an active identity';
  END IF;

  IF membership_status <> 'active' OR membership_revoked_at IS NOT NULL THEN
    RAISE EXCEPTION 'application session requires an active tenant membership';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_active_identity_session ON application_sessions;
CREATE TRIGGER trg_enforce_active_identity_session
  BEFORE INSERT ON application_sessions
  FOR EACH ROW EXECUTE FUNCTION enforce_active_identity_session();

CREATE OR REPLACE FUNCTION revoke_identity_sessions_on_access_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'tenant_memberships' THEN
    IF NEW.status = 'revoked' OR NEW.revoked_at IS NOT NULL THEN
      UPDATE application_sessions
         SET revoked_at = COALESCE(NEW.revoked_at, now())
       WHERE tenant_id = NEW.tenant_id
         AND user_id = NEW.user_id
         AND revoked_at IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'user_identities' AND NEW.status = 'disabled' THEN
    UPDATE application_sessions
       SET revoked_at = now()
     WHERE user_id = NEW.user_id
       AND revoked_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_revoke_sessions_on_membership ON tenant_memberships;
CREATE TRIGGER trg_revoke_sessions_on_membership
  AFTER UPDATE ON tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION revoke_identity_sessions_on_access_change();

DROP TRIGGER IF EXISTS trg_revoke_sessions_on_identity ON user_identities;
CREATE TRIGGER trg_revoke_sessions_on_identity
  AFTER UPDATE ON user_identities
  FOR EACH ROW EXECUTE FUNCTION revoke_identity_sessions_on_access_change();
CREATE OR REPLACE FUNCTION prevent_identity_evidence_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'identity security evidence is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_identity_audit_update ON identity_audit_events;
CREATE TRIGGER trg_prevent_identity_audit_update
  BEFORE UPDATE OR DELETE ON identity_audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_identity_evidence_mutation();

DROP TRIGGER IF EXISTS trg_prevent_identity_webhook_update ON identity_webhook_receipts;
CREATE TRIGGER trg_prevent_identity_webhook_update
  BEFORE UPDATE OR DELETE ON identity_webhook_receipts
  FOR EACH ROW EXECUTE FUNCTION prevent_identity_evidence_mutation();

CREATE INDEX IF NOT EXISTS idx_user_identities_status_email
  ON user_identities(status, normalized_email);

CREATE INDEX IF NOT EXISTS idx_identity_accounts_user
  ON identity_provider_accounts(user_id, provider);

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_active
  ON tenant_memberships(user_id, tenant_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_card_access_grants_authorization
  ON card_access_grants(user_id, tenant_id, card_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_application_sessions_active_lookup
  ON application_sessions(session_token_hash, idle_expires_at, absolute_expires_at)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_application_sessions_user
  ON application_sessions(user_id, tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_identity_oauth_transactions_active
  ON identity_oauth_transactions(transaction_token_hash, expires_at)
  WHERE consumed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_identity_audit_tenant_time
  ON identity_audit_events(tenant_id, occurred_at DESC, event_id);

COMMENT ON TABLE user_identities IS 'Internal user identity records mapped from verified WorkOS subjects.';
COMMENT ON TABLE identity_provider_accounts IS 'Minimal provider account mapping; provider secrets and tokens are not stored.';
COMMENT ON TABLE tenant_memberships IS 'Internal source of truth for tenant role assignment.';
COMMENT ON TABLE card_access_grants IS 'Explicit card-scoped permissions for non-privileged tenant members.';
COMMENT ON TABLE application_sessions IS 'Opaque, hashed, revocable BidayaX application sessions.';
COMMENT ON TABLE identity_oauth_transactions IS 'One-time OAuth state and encrypted PKCE transaction records.';
COMMENT ON TABLE identity_audit_events IS 'Append-only sanitized identity and authorization security events.';
COMMENT ON TABLE identity_webhook_receipts IS 'Idempotent WorkOS webhook replay-protection receipts.';
