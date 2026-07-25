CREATE OR REPLACE FUNCTION communication_metadata_is_safe_v1(value JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN value::TEXT !~* '(authorization|bearer|token|secret|password|private[ _-]?key|raw[ _-]?(body|payload|transcript|audio)|transcript|recording|audio|e164|phone|email|@)';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION communication_trust_fields_are_allowlisted_v1(value JSONB)
RETURNS BOOLEAN AS $$
  SELECT jsonb_typeof(value) = 'object'
    AND NOT EXISTS (
      SELECT 1
        FROM jsonb_object_keys(value) AS field_name
       WHERE field_name NOT IN (
         'tenantId',
         'cardId',
         'communicationId',
         'channel',
         'eventType',
         'reasonCode',
         'occurredAt',
         'policyVersion',
         'consentReceiptId',
         'suppressionId',
         'routingPolicyId',
         'adapterId',
         'providerEventId',
         'payloadHash'
       )
    );
$$ LANGUAGE SQL IMMUTABLE;

CREATE TABLE IF NOT EXISTS communications (
  communication_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  current_state TEXT NOT NULL CHECK (
    current_state IN (
      'requested', 'policy_checking', 'authorized', 'queued', 'dispatching',
      'accepted', 'active', 'completed', 'blocked', 'cancelled', 'failed',
      'expired', 'suppressed', 'terminated'
    )
  ),
  state_version INTEGER NOT NULL DEFAULT 0 CHECK (state_version >= 0),
  request_reason TEXT NOT NULL,
  data_classification TEXT NOT NULL CHECK (
    data_classification IN (
      'public_safe_metadata', 'internal_operational_metadata',
      'sensitive_communications_metadata', 'consent_legal_evidence',
      'audit_evidence', 'trust_evidence'
    )
  ),
  retention_class TEXT NOT NULL CHECK (retention_class IN ('operational', 'consent', 'audit', 'trust')),
  adapter_reference_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND communication_metadata_is_safe_v1(metadata)
  ),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (communication_id, tenant_id),
  UNIQUE (communication_id, tenant_id, card_id),
  UNIQUE (tenant_id, communication_id),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS communication_participants (
  participant_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('external_contact', 'executive', 'tenant_user', 'system', 'adapter')),
  display_name_hash TEXT CHECK (display_name_hash IS NULL OR display_name_hash ~ '^[0-9a-f]{64}$'),
  locale TEXT,
  trust_reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (participant_id, tenant_id),
  UNIQUE (participant_id, tenant_id, card_id),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION enforce_communication_participant_card_scope_v1()
RETURNS TRIGGER AS $$
DECLARE
  parent_card_id TEXT;
BEGIN
  SELECT card_id INTO parent_card_id
    FROM communication_participants
   WHERE tenant_id = NEW.tenant_id
     AND participant_id = NEW.participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'communication participant reference requires an existing participant';
  END IF;

  IF NEW.card_id IS DISTINCT FROM parent_card_id THEN
    RAISE EXCEPTION 'communication participant reference card scope does not match participant';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_communication_reference_card_scope_v1()
RETURNS TRIGGER AS $$
DECLARE
  parent_card_id TEXT;
BEGIN
  IF NEW.communication_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT card_id INTO parent_card_id
    FROM communications
   WHERE tenant_id = NEW.tenant_id
     AND communication_id = NEW.communication_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'communication reference requires an existing communication';
  END IF;

  IF NEW.card_id IS DISTINCT FROM parent_card_id THEN
    RAISE EXCEPTION 'communication reference card scope does not match communication';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS communication_participant_endpoints (
  endpoint_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  participant_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  endpoint_value_hash TEXT NOT NULL CHECK (endpoint_value_hash ~ '^[0-9a-f]{64}$'),
  normalized_hint TEXT CHECK (
    normalized_hint IS NULL OR normalized_hint !~* '(authorization|bearer|token|secret|password|private[ _-]?key|raw[ _-]?(body|payload|transcript|audio)|transcript|recording|audio|e164|phone|email|@)'
  ),
  verification_state TEXT NOT NULL CHECK (verification_state IN ('unverified', 'verified', 'revoked', 'suppressed')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (endpoint_id, tenant_id),
  UNIQUE (tenant_id, participant_id, channel, endpoint_value_hash),
  FOREIGN KEY (participant_id, tenant_id)
    REFERENCES communication_participants(participant_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (participant_id, tenant_id, card_id)
    REFERENCES communication_participants(participant_id, tenant_id, card_id)
    ON DELETE CASCADE,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS trg_communication_endpoint_card_scope ON communication_participant_endpoints;
CREATE TRIGGER trg_communication_endpoint_card_scope
  BEFORE INSERT OR UPDATE ON communication_participant_endpoints
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_participant_card_scope_v1();

CREATE TABLE IF NOT EXISTS communication_consent_policies (
  consent_policy_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  policy_version TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  purpose TEXT NOT NULL CHECK (
    purpose IN ('callback', 'scheduling', 'support', 'relationship_follow_up', 'emergency_escalation')
  ),
  disclosure_required BOOLEAN NOT NULL DEFAULT TRUE,
  recording_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  transcription_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  retention_class TEXT NOT NULL CHECK (retention_class IN ('operational', 'consent', 'audit', 'trust')),
  effective_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (consent_policy_id, tenant_id),
  UNIQUE (tenant_id, card_id, policy_version, channel, purpose, jurisdiction),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  CHECK (expires_at IS NULL OR expires_at > effective_at)
);

CREATE OR REPLACE FUNCTION enforce_communication_consent_policy_scope_v1()
RETURNS TRIGGER AS $$
DECLARE
  policy_record communication_consent_policies%ROWTYPE;
BEGIN
  SELECT * INTO policy_record
    FROM communication_consent_policies
   WHERE tenant_id = NEW.tenant_id
     AND consent_policy_id = NEW.consent_policy_id;

  IF policy_record.consent_policy_id IS NULL THEN
    RAISE EXCEPTION 'communication consent receipt requires an existing policy';
  END IF;

  IF policy_record.card_id IS NOT NULL
     AND NEW.card_id IS DISTINCT FROM policy_record.card_id THEN
    RAISE EXCEPTION 'communication consent receipt card scope does not match policy';
  END IF;

  IF NEW.channel <> policy_record.channel THEN
    RAISE EXCEPTION 'communication consent receipt channel does not match policy';
  END IF;

  IF NEW.purpose <> policy_record.purpose THEN
    RAISE EXCEPTION 'communication consent receipt purpose does not match policy';
  END IF;

  IF NEW.effective_at < policy_record.effective_at
     OR (policy_record.expires_at IS NOT NULL AND NEW.effective_at >= policy_record.expires_at) THEN
    RAISE EXCEPTION 'communication consent receipt is outside policy effective window';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS communication_consent_receipts (
  consent_receipt_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  participant_id TEXT NOT NULL,
  consent_policy_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  purpose TEXT NOT NULL CHECK (
    purpose IN ('callback', 'scheduling', 'support', 'relationship_follow_up', 'emergency_escalation')
  ),
  status TEXT NOT NULL CHECK (status IN ('granted', 'denied', 'revoked', 'expired')),
  source TEXT NOT NULL CHECK (source IN ('visitor', 'tenant_policy', 'system_default', 'manual_review')),
  evidence_reference_id TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND communication_metadata_is_safe_v1(metadata)
  ),
  UNIQUE (consent_receipt_id, tenant_id),
  UNIQUE (consent_receipt_id, tenant_id, card_id),
  FOREIGN KEY (participant_id, tenant_id)
    REFERENCES communication_participants(participant_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (participant_id, tenant_id, card_id)
    REFERENCES communication_participants(participant_id, tenant_id, card_id)
    ON DELETE CASCADE,
  FOREIGN KEY (consent_policy_id, tenant_id)
    REFERENCES communication_consent_policies(consent_policy_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  CHECK (expires_at IS NULL OR expires_at > effective_at),
  CHECK ((status = 'revoked') = (revoked_at IS NOT NULL))
);

DROP TRIGGER IF EXISTS trg_communication_consent_receipt_card_scope ON communication_consent_receipts;
CREATE TRIGGER trg_communication_consent_receipt_card_scope
  BEFORE INSERT OR UPDATE ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_participant_card_scope_v1();

DROP TRIGGER IF EXISTS trg_communication_consent_policy_scope ON communication_consent_receipts;
CREATE TRIGGER trg_communication_consent_policy_scope
  BEFORE INSERT OR UPDATE ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_consent_policy_scope_v1();

CREATE TABLE IF NOT EXISTS communication_suppressions (
  suppression_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  participant_id TEXT NOT NULL,
  channel TEXT CHECK (channel IS NULL OR channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  purpose TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'released', 'expired')),
  reason_code TEXT NOT NULL,
  created_by_actor_id TEXT NOT NULL,
  released_by_actor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  release_reason TEXT,
  audit_event_id TEXT,
  UNIQUE (suppression_id, tenant_id),
  UNIQUE (suppression_id, tenant_id, card_id),
  FOREIGN KEY (participant_id, tenant_id)
    REFERENCES communication_participants(participant_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (participant_id, tenant_id, card_id)
    REFERENCES communication_participants(participant_id, tenant_id, card_id)
    ON DELETE CASCADE,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  CHECK ((status = 'released') = (released_at IS NOT NULL)),
  CHECK ((released_at IS NULL) = (released_by_actor_id IS NULL)),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

DROP TRIGGER IF EXISTS trg_communication_suppression_card_scope ON communication_suppressions;
CREATE TRIGGER trg_communication_suppression_card_scope
  BEFORE INSERT OR UPDATE ON communication_suppressions
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_participant_card_scope_v1();

CREATE TABLE IF NOT EXISTS communication_lifecycle_transitions (
  transition_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT NOT NULL,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  actor_user_id TEXT,
  authorization_decision_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND communication_metadata_is_safe_v1(metadata)
  ),
  UNIQUE (transition_id, tenant_id),
  UNIQUE (tenant_id, communication_id, sequence_number),
  FOREIGN KEY (communication_id, tenant_id)
    REFERENCES communications(communication_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (communication_id, tenant_id, card_id)
    REFERENCES communications(communication_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, actor_user_id)
    REFERENCES tenant_memberships(tenant_id, user_id)
    ON DELETE RESTRICT,
  CHECK (
    from_state IN (
      'requested', 'policy_checking', 'authorized', 'queued', 'dispatching',
      'accepted', 'active', 'completed', 'blocked', 'cancelled', 'failed',
      'expired', 'suppressed', 'terminated'
    )
  ),
  CHECK (
    to_state IN (
      'requested', 'policy_checking', 'authorized', 'queued', 'dispatching',
      'accepted', 'active', 'completed', 'blocked', 'cancelled', 'failed',
      'expired', 'suppressed', 'terminated'
    )
  )
);

DROP TRIGGER IF EXISTS trg_communication_lifecycle_card_scope ON communication_lifecycle_transitions;
CREATE TRIGGER trg_communication_lifecycle_card_scope
  BEFORE INSERT OR UPDATE ON communication_lifecycle_transitions
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE TABLE IF NOT EXISTS communication_command_idempotency_keys (
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  result_communication_id TEXT,
  actor_user_id TEXT NOT NULL,
  session_id TEXT,
  card_grant_id TEXT,
  authorization_decision_id TEXT NOT NULL,
  permission_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'completed', 'failed', 'replayed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, card_id, operation, idempotency_key),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (result_communication_id, tenant_id)
    REFERENCES communications(communication_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (result_communication_id, tenant_id, card_id)
    REFERENCES communications(communication_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, actor_user_id)
    REFERENCES tenant_memberships(tenant_id, user_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (session_id)
    REFERENCES application_sessions(session_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_grant_id)
    REFERENCES card_access_grants(grant_id)
    ON DELETE RESTRICT,
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE OR REPLACE FUNCTION enforce_communication_authorization_evidence_v1()
RETURNS TRIGGER AS $$
DECLARE
  membership_record tenant_memberships%ROWTYPE;
  session_record application_sessions%ROWTYPE;
  grant_record card_access_grants%ROWTYPE;
BEGIN
  SELECT * INTO membership_record
    FROM tenant_memberships
   WHERE tenant_id = NEW.tenant_id
     AND user_id = NEW.actor_user_id;

  IF membership_record.membership_id IS NULL OR membership_record.status <> 'active' THEN
    RAISE EXCEPTION 'communication command requires an active tenant membership';
  END IF;

  IF NEW.session_id IS NOT NULL THEN
    SELECT * INTO session_record
      FROM application_sessions
     WHERE session_id = NEW.session_id
       AND tenant_id = NEW.tenant_id
       AND user_id = NEW.actor_user_id;

    IF session_record.session_id IS NULL THEN
      RAISE EXCEPTION 'communication command session does not match actor and tenant';
    END IF;

    IF session_record.revoked_at IS NOT NULL
       OR NEW.created_at >= session_record.idle_expires_at
       OR NEW.created_at >= session_record.absolute_expires_at THEN
      RAISE EXCEPTION 'communication command session is not active';
    END IF;
  END IF;

  IF NEW.card_grant_id IS NOT NULL THEN
    SELECT * INTO grant_record
      FROM card_access_grants
     WHERE grant_id = NEW.card_grant_id
       AND tenant_id = NEW.tenant_id
       AND card_id = NEW.card_id
       AND user_id = NEW.actor_user_id;

    IF grant_record.grant_id IS NULL THEN
      RAISE EXCEPTION 'communication command grant does not match actor, tenant, and card';
    END IF;

    IF grant_record.revoked_at IS NOT NULL
       OR (grant_record.expires_at IS NOT NULL AND NEW.created_at >= grant_record.expires_at) THEN
      RAISE EXCEPTION 'communication command grant is not active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_command_authorization ON communication_command_idempotency_keys;
CREATE TRIGGER trg_communication_command_authorization
  BEFORE INSERT ON communication_command_idempotency_keys
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_authorization_evidence_v1();

CREATE TABLE IF NOT EXISTS communication_dispatch_attempts (
  attempt_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (
    purpose IN ('callback', 'scheduling', 'support', 'relationship_follow_up', 'emergency_escalation')
  ),
  consent_receipt_id TEXT,
  suppression_id TEXT,
  command_operation TEXT NOT NULL,
  command_idempotency_key TEXT NOT NULL,
  adapter_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  state TEXT NOT NULL CHECK (state IN ('queued', 'blocked', 'failed', 'cancelled')),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  provider_dispatch_enabled BOOLEAN NOT NULL DEFAULT FALSE CHECK (provider_dispatch_enabled = FALSE),
  provider_reference_id TEXT,
  failure_reason_code TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (attempt_id, tenant_id),
  FOREIGN KEY (communication_id, tenant_id)
    REFERENCES communications(communication_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (communication_id, tenant_id, card_id)
    REFERENCES communications(communication_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (participant_id, tenant_id, card_id)
    REFERENCES communication_participants(participant_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (consent_receipt_id, tenant_id, card_id)
    REFERENCES communication_consent_receipts(consent_receipt_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (suppression_id, tenant_id, card_id)
    REFERENCES communication_suppressions(suppression_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, card_id, command_operation, command_idempotency_key)
    REFERENCES communication_command_idempotency_keys(tenant_id, card_id, operation, idempotency_key)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  CHECK (state <> 'queued' OR consent_receipt_id IS NOT NULL)
);

DROP TRIGGER IF EXISTS trg_communication_dispatch_card_scope ON communication_dispatch_attempts;
CREATE TRIGGER trg_communication_dispatch_card_scope
  BEFORE INSERT OR UPDATE ON communication_dispatch_attempts
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE OR REPLACE FUNCTION enforce_communication_dispatch_policy_v1()
RETURNS TRIGGER AS $$
DECLARE
  active_consent_count INTEGER;
  selected_consent_count INTEGER;
  active_suppression_count INTEGER;
BEGIN
  IF NEW.provider_dispatch_enabled THEN
    RAISE EXCEPTION 'communication provider dispatch is disabled until a later authorized phase';
  END IF;

  IF NEW.state = 'queued' THEN
    SELECT count(*) INTO selected_consent_count
      FROM communication_consent_receipts receipt
     WHERE receipt.consent_receipt_id = NEW.consent_receipt_id
       AND receipt.tenant_id = NEW.tenant_id
       AND receipt.card_id IS NOT DISTINCT FROM NEW.card_id
       AND receipt.participant_id = NEW.participant_id
       AND receipt.channel = NEW.channel
       AND receipt.purpose = NEW.purpose
       AND receipt.status = 'granted'
       AND receipt.effective_at <= NEW.created_at
       AND (receipt.expires_at IS NULL OR receipt.expires_at > NEW.created_at)
       AND receipt.revoked_at IS NULL
       AND NOT EXISTS (
         SELECT 1
           FROM communication_consent_receipts revocation
          WHERE revocation.tenant_id = NEW.tenant_id
            AND revocation.card_id IS NOT DISTINCT FROM NEW.card_id
            AND revocation.participant_id = NEW.participant_id
            AND revocation.channel = NEW.channel
            AND revocation.purpose = NEW.purpose
            AND revocation.status = 'revoked'
            AND revocation.effective_at <= NEW.created_at
       );

    SELECT count(*) INTO active_consent_count
      FROM communication_consent_receipts receipt
     WHERE receipt.tenant_id = NEW.tenant_id
       AND receipt.card_id IS NOT DISTINCT FROM NEW.card_id
       AND receipt.participant_id = NEW.participant_id
       AND receipt.channel = NEW.channel
       AND receipt.purpose = NEW.purpose
       AND receipt.status = 'granted'
       AND receipt.effective_at <= NEW.created_at
       AND (receipt.expires_at IS NULL OR receipt.expires_at > NEW.created_at)
       AND receipt.revoked_at IS NULL
       AND NOT EXISTS (
         SELECT 1
           FROM communication_consent_receipts revocation
          WHERE revocation.tenant_id = NEW.tenant_id
            AND revocation.card_id IS NOT DISTINCT FROM NEW.card_id
            AND revocation.participant_id = NEW.participant_id
            AND revocation.channel = NEW.channel
            AND revocation.purpose = NEW.purpose
            AND revocation.status = 'revoked'
            AND revocation.effective_at <= NEW.created_at
       );

    IF selected_consent_count <> 1 THEN
      RAISE EXCEPTION 'communication dispatch requires an active cited consent receipt';
    END IF;

    IF active_consent_count <> 1 THEN
      RAISE EXCEPTION 'communication dispatch requires exactly one active consent receipt';
    END IF;

    SELECT count(*) INTO active_suppression_count
      FROM communication_suppressions suppression
     WHERE suppression.tenant_id = NEW.tenant_id
       AND suppression.card_id IS NOT DISTINCT FROM NEW.card_id
       AND suppression.participant_id = NEW.participant_id
       AND suppression.status = 'active'
       AND suppression.created_at <= NEW.created_at
       AND suppression.released_at IS NULL
       AND (suppression.expires_at IS NULL OR suppression.expires_at > NEW.created_at)
       AND (suppression.channel IS NULL OR suppression.channel = NEW.channel)
       AND (suppression.purpose IS NULL OR suppression.purpose = NEW.purpose);

    IF active_suppression_count > 0 THEN
      RAISE EXCEPTION 'communication dispatch is blocked by an active suppression';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_dispatch_policy ON communication_dispatch_attempts;
CREATE TRIGGER trg_communication_dispatch_policy
  BEFORE INSERT OR UPDATE ON communication_dispatch_attempts
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_dispatch_policy_v1();

CREATE TABLE IF NOT EXISTS communication_webhook_evidence (
  webhook_evidence_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  provider_account_reference TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
  signature_verified BOOLEAN NOT NULL,
  durable_payload_retention_enabled BOOLEAN NOT NULL DEFAULT FALSE CHECK (durable_payload_retention_enabled = FALSE),
  sanitized_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(sanitized_metadata) = 'object'
    AND communication_metadata_is_safe_v1(sanitized_metadata)
  ),
  received_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (webhook_evidence_id, tenant_id),
  UNIQUE (tenant_id, provider_account_reference, provider_event_id),
  FOREIGN KEY (communication_id, tenant_id)
    REFERENCES communications(communication_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (communication_id, tenant_id, card_id)
    REFERENCES communications(communication_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS trg_communication_webhook_card_scope ON communication_webhook_evidence;
CREATE TRIGGER trg_communication_webhook_card_scope
  BEFORE INSERT OR UPDATE ON communication_webhook_evidence
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE TABLE IF NOT EXISTS communication_routing_policies (
  routing_policy_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  policy_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled', 'superseded')),
  channel TEXT CHECK (channel IS NULL OR channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  priority INTEGER NOT NULL CHECK (priority >= 0),
  condition JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(condition) = 'object'
    AND communication_metadata_is_safe_v1(condition)
  ),
  action JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(action) = 'object'
    AND communication_metadata_is_safe_v1(action)
  ),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (routing_policy_id, tenant_id),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS communication_receptionist_sessions (
  receptionist_session_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT NOT NULL,
  receptionist_interaction_id UUID,
  language TEXT NOT NULL,
  escalation_state TEXT NOT NULL CHECK (escalation_state IN ('none', 'requested', 'approved', 'blocked')),
  can_dispatch_providers_directly BOOLEAN NOT NULL DEFAULT FALSE CHECK (can_dispatch_providers_directly = FALSE),
  safe_summary_hash TEXT CHECK (safe_summary_hash IS NULL OR safe_summary_hash ~ '^[0-9a-f]{64}$'),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (receptionist_session_id, tenant_id),
  FOREIGN KEY (communication_id, tenant_id)
    REFERENCES communications(communication_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (communication_id, tenant_id, card_id)
    REFERENCES communications(communication_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS trg_communication_receptionist_card_scope ON communication_receptionist_sessions;
CREATE TRIGGER trg_communication_receptionist_card_scope
  BEFORE INSERT OR UPDATE ON communication_receptionist_sessions
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE TABLE IF NOT EXISTS communication_adapter_health (
  adapter_health_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  adapter_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unavailable')),
  checked_at TIMESTAMPTZ NOT NULL,
  reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(reason_codes) = 'array'),
  sanitized_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(sanitized_metadata) = 'object'
    AND communication_metadata_is_safe_v1(sanitized_metadata)
  ),
  UNIQUE (adapter_health_id, tenant_id),
  UNIQUE (tenant_id, adapter_id, checked_at)
);

CREATE TABLE IF NOT EXISTS communication_trust_evidence_references (
  trust_evidence_reference_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (
    domain IN (
      'communications.lifecycle', 'communications.consent',
      'communications.suppression', 'communications.routing',
      'communications.audit', 'communications.webhook'
    )
  ),
  artifact_schema TEXT NOT NULL CHECK (
    artifact_schema IN (
      'communication-lifecycle-v1', 'communication-consent-v1',
      'communication-suppression-v1', 'communication-routing-v1',
      'communication-audit-v1', 'communication-webhook-evidence-v1'
    )
  ),
  canonicalization_version TEXT NOT NULL CHECK (canonicalization_version = 'bidayax-c14n-1'),
  key_purpose TEXT NOT NULL CHECK (
    key_purpose IN (
      'audit_chain_signing', 'agent_message_signing', 'capital_document_signing',
      'provenance_signing', 'settings_signing', 'verification_only'
    )
  ),
  envelope_id TEXT,
  trust_event_id TEXT,
  evidence_fields JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(evidence_fields) = 'object'
    AND communication_metadata_is_safe_v1(evidence_fields)
    AND communication_trust_fields_are_allowlisted_v1(evidence_fields)
  ),
  recorded_at TIMESTAMPTZ NOT NULL,
  UNIQUE (trust_evidence_reference_id, tenant_id),
  FOREIGN KEY (communication_id, tenant_id)
    REFERENCES communications(communication_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (communication_id, tenant_id, card_id)
    REFERENCES communications(communication_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (envelope_id, tenant_id)
    REFERENCES cryptographic_envelopes(envelope_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (trust_event_id, tenant_id)
    REFERENCES trust_events(event_id, tenant_id)
    ON DELETE RESTRICT
);

DROP TRIGGER IF EXISTS trg_communication_trust_reference_card_scope ON communication_trust_evidence_references;
CREATE TRIGGER trg_communication_trust_reference_card_scope
  BEFORE INSERT OR UPDATE ON communication_trust_evidence_references
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE TABLE IF NOT EXISTS communication_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  communication_id TEXT,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'service', 'platform', 'system')),
  actor_user_id TEXT,
  authorization_decision_id TEXT NOT NULL,
  permission_version TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('succeeded', 'failed', 'denied', 'blocked')),
  reason_code TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND communication_metadata_is_safe_v1(metadata)
  ),
  UNIQUE (audit_event_id, tenant_id),
  FOREIGN KEY (communication_id, tenant_id)
    REFERENCES communications(communication_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (communication_id, tenant_id, card_id)
    REFERENCES communications(communication_id, tenant_id, card_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, actor_user_id)
    REFERENCES tenant_memberships(tenant_id, user_id)
    ON DELETE RESTRICT,
  CHECK ((actor_type = 'user') = (actor_user_id IS NOT NULL))
);

DROP TRIGGER IF EXISTS trg_communication_audit_card_scope ON communication_audit_events;
CREATE TRIGGER trg_communication_audit_card_scope
  BEFORE INSERT OR UPDATE ON communication_audit_events
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE OR REPLACE FUNCTION prevent_communication_evidence_mutation_v1()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'communications evidence is immutable and append-only';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_communication_lifecycle_transition_v1()
RETURNS TRIGGER AS $$
DECLARE
  current_communication communications%ROWTYPE;
BEGIN
  SELECT * INTO current_communication
    FROM communications
   WHERE tenant_id = NEW.tenant_id
     AND communication_id = NEW.communication_id
   FOR UPDATE;

  IF current_communication.communication_id IS NULL THEN
    RAISE EXCEPTION 'communication lifecycle transition requires an existing communication';
  END IF;

  IF NEW.card_id IS DISTINCT FROM current_communication.card_id THEN
    RAISE EXCEPTION 'communication lifecycle transition card scope does not match communication';
  END IF;

  IF NEW.from_state <> current_communication.current_state THEN
    RAISE EXCEPTION 'communication lifecycle transition does not match current state';
  END IF;

  IF NEW.sequence_number <> current_communication.state_version + 1 THEN
    RAISE EXCEPTION 'communication lifecycle transition sequence must increment by one';
  END IF;

  IF NOT (
    (NEW.from_state = 'requested' AND NEW.to_state IN ('policy_checking', 'blocked', 'suppressed', 'cancelled'))
    OR (NEW.from_state = 'policy_checking' AND NEW.to_state IN ('authorized', 'blocked', 'suppressed', 'expired'))
    OR (NEW.from_state = 'authorized' AND NEW.to_state IN ('queued', 'blocked', 'suppressed', 'cancelled'))
    OR (NEW.from_state = 'queued' AND NEW.to_state IN ('dispatching', 'cancelled', 'expired', 'suppressed'))
    OR (NEW.from_state = 'dispatching' AND NEW.to_state IN ('accepted', 'failed', 'terminated'))
    OR (NEW.from_state = 'accepted' AND NEW.to_state IN ('active', 'completed', 'failed', 'terminated'))
    OR (NEW.from_state = 'active' AND NEW.to_state IN ('completed', 'failed', 'terminated'))
  ) THEN
    RAISE EXCEPTION 'invalid communication lifecycle transition from % to %', NEW.from_state, NEW.to_state;
  END IF;

  UPDATE communications
     SET current_state = NEW.to_state,
         state_version = NEW.sequence_number,
         updated_at = NEW.occurred_at
   WHERE tenant_id = NEW.tenant_id
     AND communication_id = NEW.communication_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_lifecycle_transition ON communication_lifecycle_transitions;
CREATE TRIGGER trg_communication_lifecycle_transition
  BEFORE INSERT ON communication_lifecycle_transitions
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_lifecycle_transition_v1();

DROP TRIGGER IF EXISTS trg_communication_lifecycle_append_only ON communication_lifecycle_transitions;
CREATE TRIGGER trg_communication_lifecycle_append_only
  BEFORE UPDATE OR DELETE ON communication_lifecycle_transitions
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

DROP TRIGGER IF EXISTS trg_communication_consent_receipts_append_only ON communication_consent_receipts;
CREATE TRIGGER trg_communication_consent_receipts_append_only
  BEFORE UPDATE OR DELETE ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

DROP TRIGGER IF EXISTS trg_communication_webhook_evidence_append_only ON communication_webhook_evidence;
CREATE TRIGGER trg_communication_webhook_evidence_append_only
  BEFORE UPDATE OR DELETE ON communication_webhook_evidence
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

DROP TRIGGER IF EXISTS trg_communication_trust_references_append_only ON communication_trust_evidence_references;
CREATE TRIGGER trg_communication_trust_references_append_only
  BEFORE UPDATE OR DELETE ON communication_trust_evidence_references
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

DROP TRIGGER IF EXISTS trg_communication_audit_append_only ON communication_audit_events;
CREATE TRIGGER trg_communication_audit_append_only
  BEFORE UPDATE OR DELETE ON communication_audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

CREATE INDEX IF NOT EXISTS idx_communications_tenant_card_state
  ON communications(tenant_id, card_id, current_state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_participants_tenant_kind
  ON communication_participants(tenant_id, card_id, kind);
CREATE INDEX IF NOT EXISTS idx_communication_endpoints_lookup
  ON communication_participant_endpoints(tenant_id, participant_id, channel, verification_state);
CREATE INDEX IF NOT EXISTS idx_communication_consent_active
  ON communication_consent_receipts(tenant_id, participant_id, channel, purpose, status, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_suppressions_active
  ON communication_suppressions(tenant_id, participant_id, channel, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_lifecycle_timeline
  ON communication_lifecycle_transitions(tenant_id, communication_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_communication_dispatch_retry
  ON communication_dispatch_attempts(tenant_id, state, next_retry_at, retry_count);
CREATE INDEX IF NOT EXISTS idx_communication_webhook_deduplication
  ON communication_webhook_evidence(tenant_id, provider_account_reference, provider_event_id);
CREATE INDEX IF NOT EXISTS idx_communication_routing_priority
  ON communication_routing_policies(tenant_id, card_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_communication_adapter_health
  ON communication_adapter_health(tenant_id, adapter_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_audit_tenant_time
  ON communication_audit_events(tenant_id, card_id, occurred_at DESC, audit_event_id);
CREATE INDEX IF NOT EXISTS idx_communication_trust_lookup
  ON communication_trust_evidence_references(tenant_id, domain, communication_id, recorded_at DESC);

COMMENT ON TABLE communications IS 'Phase 11B Communications-owned aggregate root; provider identifiers are adapter references only.';
COMMENT ON TABLE communication_participant_endpoints IS 'Hashed communication endpoints; raw phone numbers and email addresses are prohibited.';
COMMENT ON TABLE communication_command_idempotency_keys IS 'Communications-owned command idempotency boundary; separate from telephony adapter idempotency.';
COMMENT ON TABLE communication_dispatch_attempts IS 'Dispatch-attempt state with provider execution disabled until a later authorized phase.';
COMMENT ON COLUMN communication_receptionist_sessions.receptionist_interaction_id IS 'Non-authoritative sanitized legacy receptionist reference; canonical tenant/card enforcement is through the Communications aggregate until a later tenant/card-safe receptionist cutover.';
COMMENT ON TABLE communication_audit_events IS 'Append-only sanitized Communications audit evidence, including denied actions.';
