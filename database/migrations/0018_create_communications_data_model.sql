CREATE OR REPLACE FUNCTION communication_metadata_value_is_safe_v1(field_name TEXT, field_value JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  text_value TEXT;
BEGIN
  IF field_value IS NULL THEN
    RETURN TRUE;
  END IF;

  IF jsonb_typeof(field_value) = 'object' THEN
    RETURN communication_metadata_is_safe_v1(field_value);
  END IF;

  IF jsonb_typeof(field_value) = 'array' THEN
    RETURN communication_metadata_is_safe_v1(field_value);
  END IF;

  IF jsonb_typeof(field_value) <> 'string' THEN
    RETURN TRUE;
  END IF;

  text_value := field_value #>> '{}';

  IF field_name IN ('requestHash', 'payloadHash', 'digest', 'checksumSha256') THEN
    RETURN text_value ~ '^[0-9a-f]{64}$';
  END IF;

  RETURN text_value !~* '(@|authorization|bearer|token|secret|password|private[ _-]?key|raw[ _-]?(body|payload|transcript|audio)|transcript|recording|audio|e164|phone|email|\+?[0-9][0-9 .()]{6,}[0-9]|\([0-9]{3}\)[0-9 ._-]{3,}[0-9]|(\+?1[- .]?)?\(?[2-9][0-9]{2}\)?[- .][0-9]{3}[- .][0-9]{4}|[0-9]{10,})';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION communication_metadata_is_safe_v1(metadata_value JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  entry RECORD;
BEGIN
  IF metadata_value IS NULL THEN
    RETURN FALSE;
  END IF;

  IF jsonb_typeof(metadata_value) = 'object' THEN
    FOR entry IN SELECT key, value AS item FROM jsonb_each(metadata_value) LOOP
      IF entry.key ~* '(authorization|bearer|token|secret|password|private[ _-]?key|raw[ _-]?(body|payload|transcript|audio)|transcript|recording|audio|e164|phone|email)' THEN
        RETURN FALSE;
      END IF;

      IF NOT communication_metadata_value_is_safe_v1(entry.key, entry.item) THEN
        RETURN FALSE;
      END IF;
    END LOOP;

    RETURN TRUE;
  END IF;

  IF jsonb_typeof(metadata_value) = 'array' THEN
    FOR entry IN SELECT value AS item FROM jsonb_array_elements(metadata_value) LOOP
      IF NOT communication_metadata_value_is_safe_v1('', entry.item) THEN
        RETURN FALSE;
      END IF;
    END LOOP;

    RETURN TRUE;
  END IF;

  RETURN communication_metadata_value_is_safe_v1('', metadata_value);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION communication_reason_codes_are_safe_v1(value JSONB)
RETURNS BOOLEAN AS $$
  SELECT jsonb_typeof(value) = 'array'
    AND jsonb_array_length(value) <= 16
    AND NOT EXISTS (
      SELECT 1
        FROM jsonb_array_elements(value) AS reason_code
       WHERE jsonb_typeof(reason_code) <> 'string'
          OR length(reason_code #>> '{}') > 64
          OR (reason_code #>> '{}') !~ '^[A-Z][A-Z0-9_]{1,63}$'
    )
    AND communication_metadata_is_safe_v1(value);
$$ LANGUAGE SQL IMMUTABLE;

ALTER TABLE cryptographic_envelopes
  DROP CONSTRAINT IF EXISTS cryptographic_envelopes_domain_check;

ALTER TABLE cryptographic_envelopes
  ADD CONSTRAINT cryptographic_envelopes_domain_check CHECK (domain IN (
    'settings.snapshot', 'brand.tokens.snapshot', 'identity.audit', 'identity.session',
    'identity.authorization', 'telephony.audit', 'telephony.usage', 'telephony.safety',
    'receptionist.runtime', 'receptionist.consent', 'receptionist.retention',
    'receptionist.redaction', 'receptionist.safety', 'receptionist.tool_authorization',
    'governance.legal_hold', 'governance.erasure_receipt', 'governance.kill_switch',
    'capital.document', 'capital.disclosure', 'capital.consent', 'provenance.manifest',
    'watermark.asset', 'watermark.package', 'sentinelq.evidence',
    'communications.lifecycle', 'communications.consent',
    'communications.suppression', 'communications.routing',
    'communications.audit', 'communications.webhook'
  ));

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
         'consentPolicyId',
         'consentReceiptId',
         'participantId',
         'purpose',
         'status',
         'source',
         'observedAt',
         'effectiveAt',
         'expiresAt',
         'revokedAt',
         'suppressionId',
         'routingPolicyId',
         'adapterId',
         'providerEventId',
         'envelopeId',
         'payloadHash'
       )
    );
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION communication_evidence_timestamptz_matches_v1(
  evidence_value TEXT,
  actual_value TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  parsed_value TIMESTAMPTZ;
BEGIN
  IF evidence_value IS NULL OR actual_value IS NULL THEN
    RETURN FALSE;
  END IF;

  BEGIN
    parsed_value := evidence_value::timestamptz;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  RETURN parsed_value = actual_value;
END;
$$ LANGUAGE plpgsql STABLE;

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

CREATE OR REPLACE FUNCTION enforce_communication_aggregate_state_boundary_v1()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.current_state <> 'requested' OR NEW.state_version <> 0 THEN
      RAISE EXCEPTION 'communication aggregate must start in requested state at version 0';
    END IF;

    RETURN NEW;
  END IF;

  IF (NEW.current_state IS DISTINCT FROM OLD.current_state
      OR NEW.state_version IS DISTINCT FROM OLD.state_version)
     AND NOT (
       current_setting('bidayax.communication_lifecycle_transition', true) = 'true'
       AND pg_trigger_depth() > 1
     ) THEN
    RAISE EXCEPTION 'communication state may change only through lifecycle transitions';
  END IF;

  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
     OR NEW.card_id IS DISTINCT FROM OLD.card_id
     OR NEW.channel IS DISTINCT FROM OLD.channel
     OR NEW.direction IS DISTINCT FROM OLD.direction
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'communication aggregate ownership and creation fields are immutable';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_aggregate_state_boundary ON communications;
CREATE TRIGGER trg_communication_aggregate_state_boundary
  BEFORE INSERT OR UPDATE ON communications
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_aggregate_state_boundary_v1();

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

CREATE OR REPLACE FUNCTION lock_communication_policy_subject_v1(
  tenant_id TEXT,
  card_id TEXT,
  participant_id TEXT,
  channel TEXT,
  purpose TEXT
) RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      tenant_id || ':' || COALESCE(card_id, '<tenant>') || ':' ||
      participant_id || ':' || COALESCE(channel, '<any>') || ':' ||
      COALESCE(purpose, '<any>'),
      0
    )
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lock_communication_policy_subject_trigger_v1()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM lock_communication_policy_subject_hierarchy_v1(
    NEW.tenant_id,
    NEW.card_id,
    NEW.participant_id,
    NEW.channel,
    NEW.purpose
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION lock_communication_policy_subject_hierarchy_v1(
  tenant_id TEXT,
  card_id TEXT,
  participant_id TEXT,
  channel TEXT,
  purpose TEXT
) RETURNS VOID AS $$
BEGIN
  PERFORM lock_communication_policy_subject_v1(tenant_id, card_id, participant_id, channel, purpose);
  PERFORM lock_communication_policy_subject_v1(tenant_id, card_id, participant_id, NULL, purpose);
  PERFORM lock_communication_policy_subject_v1(tenant_id, card_id, participant_id, channel, NULL);
  PERFORM lock_communication_policy_subject_v1(tenant_id, card_id, participant_id, NULL, NULL);
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
    normalized_hint IS NULL OR normalized_hint !~* '(authorization|bearer|token|secret|password|private[ _-]?key|raw[ _-]?(body|payload|transcript|audio)|transcript|recording|audio|e164|phone|email|@|\+?[0-9][0-9 .()]{6,}[0-9]|\([0-9]{3}\)[0-9 ._-]{3,}[0-9]|(\+?1[- .]?)?\(?[2-9][0-9]{2}\)?[- .][0-9]{3}[- .][0-9]{4}|[0-9]{10,})'
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
  evidence_reference_id TEXT NOT NULL,
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
  BEFORE INSERT ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_participant_card_scope_v1();

DROP TRIGGER IF EXISTS trg_communication_consent_policy_scope ON communication_consent_receipts;
CREATE TRIGGER trg_communication_consent_policy_scope
  BEFORE INSERT ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_consent_policy_scope_v1();

DROP TRIGGER IF EXISTS trg_communication_consent_policy_lock ON communication_consent_receipts;
CREATE TRIGGER trg_communication_consent_policy_lock
  BEFORE INSERT ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION lock_communication_policy_subject_trigger_v1();

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
  FOREIGN KEY (tenant_id, created_by_actor_id)
    REFERENCES tenant_memberships(tenant_id, user_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, released_by_actor_id)
    REFERENCES tenant_memberships(tenant_id, user_id)
    ON DELETE RESTRICT,
  CHECK (
    (status = 'active' AND released_at IS NULL AND released_by_actor_id IS NULL AND release_reason IS NULL AND audit_event_id IS NULL)
    OR (status = 'expired' AND released_at IS NULL AND released_by_actor_id IS NULL AND release_reason IS NULL)
    OR (status = 'released' AND released_at IS NOT NULL AND released_by_actor_id IS NOT NULL AND release_reason IS NOT NULL AND audit_event_id IS NOT NULL)
  ),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

DROP TRIGGER IF EXISTS trg_communication_suppression_card_scope ON communication_suppressions;
CREATE TRIGGER trg_communication_suppression_card_scope
  BEFORE INSERT OR UPDATE ON communication_suppressions
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_participant_card_scope_v1();

DROP TRIGGER IF EXISTS trg_communication_suppression_policy_lock ON communication_suppressions;
CREATE TRIGGER trg_communication_suppression_policy_lock
  BEFORE INSERT OR UPDATE ON communication_suppressions
  FOR EACH ROW EXECUTE FUNCTION lock_communication_policy_subject_trigger_v1();

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
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('card', 'tenant', 'platform')),
  scope_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (
    operation IN (
      'request_callback', 'cancel_callback', 'schedule_communication',
      'initiate_communication', 'accept_inbound_communication_event',
      'escalate_to_human', 'suppress_communication', 'release_suppression',
      'evaluate_consent', 'evaluate_business_hours', 'evaluate_routing',
      'query_communication_status', 'terminate_communication',
      'apply_tenant_kill_switch', 'apply_platform_kill_switch'
    )
  ),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  result_communication_id TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'service', 'platform')),
  actor_user_id TEXT,
  actor_service_id TEXT,
  actor_platform_id TEXT,
  session_id TEXT,
  card_grant_id TEXT,
  authorization_decision_id TEXT NOT NULL,
  required_permission TEXT NOT NULL,
  permission_version TEXT NOT NULL CHECK (permission_version = 'communications-permissions-v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'communications-policy-v1'),
  status TEXT NOT NULL CHECK (status IN ('reserved', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, scope_type, scope_id, operation, idempotency_key),
  UNIQUE (tenant_id, card_id, operation, idempotency_key),
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
  FOREIGN KEY (actor_service_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (actor_platform_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id)
    ON DELETE RESTRICT,
  CHECK (expires_at IS NULL OR expires_at > created_at),
  CHECK (
    (scope_type = 'card' AND card_id IS NOT NULL AND scope_id = card_id)
    OR (scope_type = 'tenant' AND card_id IS NULL AND scope_id = tenant_id)
    OR (scope_type = 'platform' AND card_id IS NULL AND scope_id = 'platform')
  ),
  CHECK (
    (actor_type = 'user' AND actor_user_id IS NOT NULL AND actor_service_id IS NULL AND actor_platform_id IS NULL)
    OR (actor_type = 'service' AND actor_user_id IS NULL AND actor_service_id IS NOT NULL AND actor_platform_id IS NULL)
    OR (actor_type = 'platform' AND actor_user_id IS NULL AND actor_service_id IS NULL AND actor_platform_id IS NOT NULL)
  ),
  CHECK (
    (operation = 'apply_platform_kill_switch' AND scope_type = 'platform' AND actor_type = 'platform' AND required_permission = 'communications:platform:kill_switch')
    OR (operation = 'apply_tenant_kill_switch' AND scope_type = 'tenant' AND actor_type IN ('user', 'service') AND required_permission = 'communications:tenant:kill_switch')
    OR (operation NOT IN ('apply_platform_kill_switch', 'apply_tenant_kill_switch') AND scope_type = 'card' AND actor_type = 'user' AND required_permission = ('communications:' || operation))
  ),
  CHECK ((actor_type = 'user') = (session_id IS NOT NULL)),
  CHECK ((scope_type = 'card' AND actor_type = 'user') = (card_grant_id IS NOT NULL))
);

CREATE OR REPLACE FUNCTION enforce_communication_authorization_evidence_v1()
RETURNS TRIGGER AS $$
DECLARE
  membership_record tenant_memberships%ROWTYPE;
  session_record application_sessions%ROWTYPE;
  grant_record card_access_grants%ROWTYPE;
  service_identity_record trust_crypto_identities%ROWTYPE;
  platform_identity_record trust_crypto_identities%ROWTYPE;
BEGIN
  IF NEW.status <> 'reserved'
     OR NEW.completed_at IS NOT NULL
     OR NEW.result_communication_id IS NOT NULL THEN
    RAISE EXCEPTION 'communication command reservation must be inserted in reserved state without terminal result';
  END IF;

  IF NEW.actor_type = 'service' THEN
    SELECT * INTO service_identity_record
      FROM trust_crypto_identities
     WHERE tenant_id = NEW.tenant_id
       AND identity_id = NEW.actor_service_id
       AND identity_type = 'service'
       AND status = 'active';

    IF service_identity_record.identity_id IS NULL THEN
      RAISE EXCEPTION 'communication service command requires an active service identity';
    END IF;

    IF NEW.operation <> 'apply_tenant_kill_switch' THEN
      RAISE EXCEPTION 'communication service commands are limited to tenant kill-switch scope in Phase 11B';
    END IF;

    IF NOT (
      service_identity_record.metadata ? 'communicationsCapabilities'
      AND service_identity_record.metadata->'communicationsCapabilities' ? 'tenant_kill_switch'
    ) THEN
      RAISE EXCEPTION 'communication service command lacks tenant kill-switch capability';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.actor_type = 'platform' THEN
    SELECT * INTO platform_identity_record
      FROM trust_crypto_identities
     WHERE tenant_id = NEW.tenant_id
       AND identity_id = NEW.actor_platform_id
       AND identity_type = 'system'
       AND status = 'active';

    IF platform_identity_record.identity_id IS NULL THEN
      RAISE EXCEPTION 'communication platform command requires an active platform identity';
    END IF;

    IF NEW.operation <> 'apply_platform_kill_switch' THEN
      RAISE EXCEPTION 'communication platform commands are limited to platform kill-switch scope in Phase 11B';
    END IF;

    IF NOT (
      platform_identity_record.metadata ? 'communicationsCapabilities'
      AND platform_identity_record.metadata->'communicationsCapabilities' ? 'platform_kill_switch'
    ) THEN
      RAISE EXCEPTION 'communication platform command lacks platform kill-switch capability';
    END IF;

    RETURN NEW;
  END IF;

  SELECT * INTO membership_record
    FROM tenant_memberships
   WHERE tenant_id = NEW.tenant_id
     AND user_id = NEW.actor_user_id;

  IF membership_record.membership_id IS NULL OR membership_record.status <> 'active' THEN
    RAISE EXCEPTION 'communication command requires an active tenant membership';
  END IF;

  IF NEW.scope_type = 'tenant'
     AND NEW.operation = 'apply_tenant_kill_switch'
     AND membership_record.role NOT IN ('tenant_owner', 'tenant_admin') THEN
    RAISE EXCEPTION 'communication tenant kill-switch command requires owner or admin membership';
  END IF;

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

  IF NEW.scope_type = 'card' THEN
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

    IF NOT (grant_record.permission_set ? NEW.required_permission) THEN
      RAISE EXCEPTION 'communication command grant lacks required permission';
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
  card_id TEXT NOT NULL,
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
  policy_evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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
  evaluation_time TIMESTAMPTZ;
BEGIN
  IF NEW.provider_dispatch_enabled THEN
    RAISE EXCEPTION 'communication provider dispatch is disabled until a later authorized phase';
  END IF;

  IF TG_OP = 'UPDATE'
     AND (
       NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.card_id IS DISTINCT FROM OLD.card_id
       OR NEW.communication_id IS DISTINCT FROM OLD.communication_id
       OR NEW.participant_id IS DISTINCT FROM OLD.participant_id
       OR NEW.purpose IS DISTINCT FROM OLD.purpose
       OR NEW.consent_receipt_id IS DISTINCT FROM OLD.consent_receipt_id
       OR NEW.command_operation IS DISTINCT FROM OLD.command_operation
       OR NEW.command_idempotency_key IS DISTINCT FROM OLD.command_idempotency_key
       OR NEW.adapter_id IS DISTINCT FROM OLD.adapter_id
       OR NEW.channel IS DISTINCT FROM OLD.channel
       OR NEW.provider_dispatch_enabled IS DISTINCT FROM OLD.provider_dispatch_enabled
       OR NEW.provider_reference_id IS DISTINCT FROM OLD.provider_reference_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
     ) THEN
    RAISE EXCEPTION 'communication dispatch authorization fields are immutable';
  END IF;

  IF NEW.state = 'queued' THEN
    PERFORM lock_communication_policy_subject_hierarchy_v1(
      NEW.tenant_id,
      NEW.card_id,
      NEW.participant_id,
      NEW.channel,
      NEW.purpose
    );

    NEW.policy_evaluated_at := now();
    evaluation_time := NEW.policy_evaluated_at;

    SELECT count(*) INTO selected_consent_count
      FROM communication_consent_receipts receipt
      JOIN communication_consent_policies policy
        ON policy.tenant_id = receipt.tenant_id
       AND policy.consent_policy_id = receipt.consent_policy_id
     WHERE receipt.consent_receipt_id = NEW.consent_receipt_id
       AND receipt.tenant_id = NEW.tenant_id
       AND receipt.card_id IS NOT DISTINCT FROM NEW.card_id
       AND receipt.participant_id = NEW.participant_id
       AND receipt.channel = NEW.channel
       AND receipt.purpose = NEW.purpose
       AND receipt.status = 'granted'
       AND receipt.evidence_reference_id IS NOT NULL
       AND receipt.effective_at <= evaluation_time
       AND (receipt.expires_at IS NULL OR receipt.expires_at > evaluation_time)
       AND receipt.revoked_at IS NULL
       AND policy.effective_at <= evaluation_time
       AND (policy.expires_at IS NULL OR policy.expires_at > evaluation_time)
       AND NOT EXISTS (
         SELECT 1
           FROM communication_consent_receipts revocation
          WHERE revocation.tenant_id = NEW.tenant_id
            AND revocation.card_id IS NOT DISTINCT FROM NEW.card_id
            AND revocation.participant_id = NEW.participant_id
            AND revocation.channel = NEW.channel
            AND revocation.purpose = NEW.purpose
            AND revocation.status = 'revoked'
            AND revocation.effective_at <= evaluation_time
       );

    SELECT count(*) INTO active_consent_count
      FROM communication_consent_receipts receipt
      JOIN communication_consent_policies policy
        ON policy.tenant_id = receipt.tenant_id
       AND policy.consent_policy_id = receipt.consent_policy_id
     WHERE receipt.tenant_id = NEW.tenant_id
       AND receipt.card_id IS NOT DISTINCT FROM NEW.card_id
       AND receipt.participant_id = NEW.participant_id
       AND receipt.channel = NEW.channel
       AND receipt.purpose = NEW.purpose
       AND receipt.status = 'granted'
       AND receipt.evidence_reference_id IS NOT NULL
       AND receipt.effective_at <= evaluation_time
       AND (receipt.expires_at IS NULL OR receipt.expires_at > evaluation_time)
       AND receipt.revoked_at IS NULL
       AND policy.effective_at <= evaluation_time
       AND (policy.expires_at IS NULL OR policy.expires_at > evaluation_time)
       AND NOT EXISTS (
         SELECT 1
           FROM communication_consent_receipts revocation
          WHERE revocation.tenant_id = NEW.tenant_id
            AND revocation.card_id IS NOT DISTINCT FROM NEW.card_id
            AND revocation.participant_id = NEW.participant_id
            AND revocation.channel = NEW.channel
            AND revocation.purpose = NEW.purpose
            AND revocation.status = 'revoked'
            AND revocation.effective_at <= evaluation_time
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
       AND suppression.created_at <= evaluation_time
       AND suppression.released_at IS NULL
       AND (suppression.expires_at IS NULL OR suppression.expires_at > evaluation_time)
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

CREATE TABLE IF NOT EXISTS communication_business_hours_policies (
  business_hours_policy_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  policy_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled', 'superseded')),
  timezone TEXT NOT NULL,
  weekly_windows JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (
    jsonb_typeof(weekly_windows) = 'array'
    AND communication_metadata_is_safe_v1(weekly_windows)
  ),
  exception_windows JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (
    jsonb_typeof(exception_windows) = 'array'
    AND communication_metadata_is_safe_v1(exception_windows)
  ),
  fallback_action TEXT NOT NULL CHECK (fallback_action IN ('queue', 'block', 'escalate', 'callback_required')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (business_hours_policy_id, tenant_id),
  UNIQUE (tenant_id, card_id, policy_version),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS communication_summaries (
  summary_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT NOT NULL,
  summary_version TEXT NOT NULL,
  safe_summary_hash TEXT NOT NULL CHECK (safe_summary_hash ~ '^[0-9a-f]{64}$'),
  status TEXT NOT NULL CHECK (status IN ('pending', 'available', 'withheld', 'redacted', 'failed')),
  generated_by_actor_type TEXT NOT NULL CHECK (generated_by_actor_type IN ('user', 'service', 'platform', 'system')),
  generated_by_actor_id TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND communication_metadata_is_safe_v1(metadata)
  ),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (summary_id, tenant_id),
  UNIQUE (tenant_id, communication_id, summary_version),
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

DROP TRIGGER IF EXISTS trg_communication_summary_card_scope ON communication_summaries;
CREATE TRIGGER trg_communication_summary_card_scope
  BEFORE INSERT OR UPDATE ON communication_summaries
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE OR REPLACE FUNCTION enforce_communication_summary_actor_evidence_v1()
RETURNS TRIGGER AS $$
DECLARE
  membership_record tenant_memberships%ROWTYPE;
  session_record application_sessions%ROWTYPE;
  grant_record card_access_grants%ROWTYPE;
  service_identity_record trust_crypto_identities%ROWTYPE;
  platform_identity_record trust_crypto_identities%ROWTYPE;
BEGIN
  IF NEW.generated_by_actor_type = 'user' THEN
    SELECT * INTO membership_record
      FROM tenant_memberships
     WHERE tenant_id = NEW.tenant_id
       AND user_id = NEW.generated_by_actor_id
       AND status = 'active';

    IF membership_record.membership_id IS NULL THEN
      RAISE EXCEPTION 'communication summary user actor requires active tenant membership';
    END IF;

    SELECT * INTO session_record
      FROM application_sessions
     WHERE session_id = NEW.metadata->>'sessionId'
       AND tenant_id = NEW.tenant_id
       AND user_id = NEW.generated_by_actor_id;

    IF session_record.session_id IS NULL
       OR session_record.revoked_at IS NOT NULL
       OR NEW.created_at >= session_record.idle_expires_at
       OR NEW.created_at >= session_record.absolute_expires_at THEN
      RAISE EXCEPTION 'communication summary user actor requires an active session';
    END IF;

    SELECT * INTO grant_record
      FROM card_access_grants
     WHERE grant_id = NEW.metadata->>'cardGrantId'
       AND tenant_id = NEW.tenant_id
       AND card_id = NEW.card_id
       AND user_id = NEW.generated_by_actor_id;

    IF grant_record.grant_id IS NULL
       OR grant_record.revoked_at IS NOT NULL
       OR (grant_record.expires_at IS NOT NULL AND NEW.created_at >= grant_record.expires_at)
       OR NOT (grant_record.permission_set ? COALESCE(NEW.metadata->>'requiredPermission', '')) THEN
      RAISE EXCEPTION 'communication summary user actor requires an active card grant with required permission';
    END IF;
  ELSIF NEW.generated_by_actor_type = 'service' THEN
    SELECT * INTO service_identity_record
      FROM trust_crypto_identities
     WHERE tenant_id = NEW.tenant_id
       AND identity_id = NEW.generated_by_actor_id
       AND identity_type = 'service'
       AND status = 'active';

    IF service_identity_record.identity_id IS NULL THEN
      RAISE EXCEPTION 'communication summary service actor requires active service identity';
    END IF;

    IF NOT (
      service_identity_record.metadata ? 'communicationsCapabilities'
      AND service_identity_record.metadata->'communicationsCapabilities' ? 'summary_writer'
    ) THEN
      RAISE EXCEPTION 'communication summary service actor lacks summary writer capability';
    END IF;
  ELSE
    SELECT * INTO platform_identity_record
      FROM trust_crypto_identities
     WHERE tenant_id = NEW.tenant_id
       AND identity_id = NEW.generated_by_actor_id
       AND identity_type = 'system'
       AND status = 'active';

    IF platform_identity_record.identity_id IS NULL THEN
      RAISE EXCEPTION 'communication summary platform actor requires active platform identity';
    END IF;

    IF NOT (
      platform_identity_record.metadata ? 'communicationsCapabilities'
      AND platform_identity_record.metadata->'communicationsCapabilities' ? 'summary_writer'
    ) THEN
      RAISE EXCEPTION 'communication summary platform actor lacks summary writer capability';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_summary_actor_evidence ON communication_summaries;
CREATE TRIGGER trg_communication_summary_actor_evidence
  BEFORE INSERT ON communication_summaries
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_summary_actor_evidence_v1();

CREATE TABLE IF NOT EXISTS communication_failover_events (
  failover_event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT,
  from_adapter_id TEXT,
  to_adapter_id TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('telephony', 'voice', 'messaging', 'scheduling', 'custom')),
  reason_code TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('not_required', 'blocked', 'queued_for_later', 'adapter_changed')),
  provider_dispatch_enabled BOOLEAN NOT NULL DEFAULT FALSE CHECK (provider_dispatch_enabled = FALSE),
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object'
    AND communication_metadata_is_safe_v1(metadata)
  ),
  UNIQUE (failover_event_id, tenant_id),
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

DROP TRIGGER IF EXISTS trg_communication_failover_card_scope ON communication_failover_events;
CREATE TRIGGER trg_communication_failover_card_scope
  BEFORE INSERT OR UPDATE ON communication_failover_events
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE TABLE IF NOT EXISTS communication_receptionist_sessions (
  receptionist_session_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT,
  communication_id TEXT NOT NULL,
  receptionist_interaction_id UUID CHECK (receptionist_interaction_id IS NULL),
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

ALTER TABLE communication_adapter_health
  DROP CONSTRAINT IF EXISTS communication_adapter_health_reason_codes_safe;

ALTER TABLE communication_adapter_health
  ADD CONSTRAINT communication_adapter_health_reason_codes_safe CHECK (
    communication_reason_codes_are_safe_v1(reason_codes)
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
      'tenant_artifact_signing'
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
    ON DELETE RESTRICT,
  CHECK (envelope_id IS NOT NULL),
  CHECK (trust_event_id IS NOT NULL)
);

CREATE OR REPLACE FUNCTION enforce_communication_trust_reference_compatibility_v1()
RETURNS TRIGGER AS $$
DECLARE
  envelope_record cryptographic_envelopes%ROWTYPE;
  key_record trust_keys%ROWTYPE;
  trust_event_record trust_events%ROWTYPE;
  verification_record trust_verification_receipts%ROWTYPE;
BEGIN
  IF NOT (
    (NEW.domain = 'communications.lifecycle' AND NEW.artifact_schema = 'communication-lifecycle-v1')
    OR (NEW.domain = 'communications.consent' AND NEW.artifact_schema = 'communication-consent-v1')
    OR (NEW.domain = 'communications.suppression' AND NEW.artifact_schema = 'communication-suppression-v1')
    OR (NEW.domain = 'communications.routing' AND NEW.artifact_schema = 'communication-routing-v1')
    OR (NEW.domain = 'communications.audit' AND NEW.artifact_schema = 'communication-audit-v1')
    OR (NEW.domain = 'communications.webhook' AND NEW.artifact_schema = 'communication-webhook-evidence-v1')
  ) THEN
    RAISE EXCEPTION 'communication trust domain and artifact schema are incompatible';
  END IF;

  IF NEW.envelope_id IS NOT NULL THEN
    SELECT * INTO envelope_record
      FROM cryptographic_envelopes
     WHERE tenant_id = NEW.tenant_id
       AND envelope_id = NEW.envelope_id;

    IF envelope_record.envelope_id IS NULL THEN
      RAISE EXCEPTION 'communication trust reference requires an existing envelope';
    END IF;

    IF envelope_record.domain <> NEW.domain
       OR envelope_record.schema_version <> NEW.artifact_schema
       OR envelope_record.canonicalization_version <> NEW.canonicalization_version
       OR envelope_record.key_purpose <> NEW.key_purpose
       OR envelope_record.artifact_id <> NEW.communication_id
       OR envelope_record.card_id IS DISTINCT FROM NEW.card_id THEN
      RAISE EXCEPTION 'communication trust reference envelope is incompatible';
    END IF;

    IF envelope_record.status <> 'active'
       OR envelope_record.signed_at > NEW.recorded_at
       OR (envelope_record.expires_at IS NOT NULL AND envelope_record.expires_at <= NEW.recorded_at) THEN
      RAISE EXCEPTION 'communication trust reference requires active unexpired envelope evidence';
    END IF;

    SELECT * INTO key_record
      FROM trust_keys
     WHERE tenant_id = NEW.tenant_id
       AND key_id = envelope_record.key_id
       AND key_version = envelope_record.key_version
       AND purpose = envelope_record.key_purpose;

    IF key_record.key_id IS NULL
       OR key_record.status <> 'active'
       OR key_record.revoked_at IS NOT NULL
       OR key_record.compromised_at IS NOT NULL
       OR envelope_record.signed_at < key_record.valid_from
       OR (key_record.valid_until IS NOT NULL AND envelope_record.signed_at > key_record.valid_until) THEN
      RAISE EXCEPTION 'communication trust reference requires active uncompromised signing key';
    END IF;

    SELECT * INTO verification_record
      FROM trust_verification_receipts
     WHERE tenant_id = NEW.tenant_id
       AND envelope_id = NEW.envelope_id
       AND valid = TRUE
       AND verified_at >= envelope_record.signed_at
       AND verified_at <= NEW.recorded_at
     ORDER BY verified_at DESC
     LIMIT 1;

    IF verification_record.receipt_id IS NULL THEN
      RAISE EXCEPTION 'communication trust reference requires valid envelope verification receipt';
    END IF;

    IF envelope_record.payload IS DISTINCT FROM NEW.evidence_fields THEN
      RAISE EXCEPTION 'communication trust reference evidence projection must match signed envelope payload';
    END IF;
  END IF;

  IF NEW.envelope_id IS NULL THEN
    RAISE EXCEPTION 'communication trust reference requires a cryptographic envelope';
  END IF;

  SELECT * INTO trust_event_record
    FROM trust_events
   WHERE tenant_id = NEW.tenant_id
     AND event_id = NEW.trust_event_id;

  IF trust_event_record.event_id IS NULL THEN
    RAISE EXCEPTION 'communication trust reference requires an existing trust event';
  END IF;

  IF trust_event_record.event_type <> NEW.domain
     OR trust_event_record.subject_id <> NEW.communication_id
     OR trust_event_record.subject_type <> NEW.domain
     OR trust_event_record.details->>'envelopeId' <> NEW.envelope_id THEN
    RAISE EXCEPTION 'communication trust event is incompatible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_trust_reference_card_scope ON communication_trust_evidence_references;
CREATE TRIGGER trg_communication_trust_reference_card_scope
  BEFORE INSERT OR UPDATE ON communication_trust_evidence_references
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

DROP TRIGGER IF EXISTS trg_communication_trust_reference_compatibility ON communication_trust_evidence_references;
CREATE TRIGGER trg_communication_trust_reference_compatibility
  BEFORE INSERT OR UPDATE ON communication_trust_evidence_references
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_trust_reference_compatibility_v1();

ALTER TABLE communication_consent_receipts
  DROP CONSTRAINT IF EXISTS communication_consent_receipts_evidence_reference_fk;

ALTER TABLE communication_consent_receipts
  ADD CONSTRAINT communication_consent_receipts_evidence_reference_fk
  FOREIGN KEY (evidence_reference_id, tenant_id)
  REFERENCES communication_trust_evidence_references(trust_evidence_reference_id, tenant_id)
  ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION enforce_communication_consent_evidence_reference_v1()
RETURNS TRIGGER AS $$
DECLARE
  trust_reference_record communication_trust_evidence_references%ROWTYPE;
  policy_record communication_consent_policies%ROWTYPE;
BEGIN
  SELECT * INTO trust_reference_record
    FROM communication_trust_evidence_references
   WHERE tenant_id = NEW.tenant_id
     AND trust_evidence_reference_id = NEW.evidence_reference_id
     AND domain = 'communications.consent'
     AND artifact_schema = 'communication-consent-v1'
     AND card_id IS NOT DISTINCT FROM NEW.card_id;

  IF trust_reference_record.trust_evidence_reference_id IS NULL THEN
    RAISE EXCEPTION 'communication consent receipt requires matching durable consent evidence reference';
  END IF;

  IF trust_reference_record.evidence_fields->>'consentReceiptId' <> NEW.consent_receipt_id
     OR trust_reference_record.evidence_fields->>'channel' <> NEW.channel
     OR trust_reference_record.evidence_fields->>'purpose' <> NEW.purpose
     OR trust_reference_record.evidence_fields->>'participantId' <> NEW.participant_id
     OR trust_reference_record.evidence_fields->>'consentPolicyId' <> NEW.consent_policy_id
     OR trust_reference_record.evidence_fields->>'status' <> NEW.status
     OR trust_reference_record.evidence_fields->>'source' <> NEW.source
     OR trust_reference_record.evidence_fields->>'policyVersion' IS NULL THEN
    RAISE EXCEPTION 'communication consent evidence reference does not match receipt';
  END IF;

  IF NEW.effective_at > NEW.observed_at
     OR (NEW.expires_at IS NOT NULL AND NEW.expires_at <= NEW.effective_at)
     OR (NEW.revoked_at IS NOT NULL AND NEW.revoked_at < NEW.effective_at) THEN
    RAISE EXCEPTION 'communication consent receipt chronology is invalid';
  END IF;

  IF NOT communication_evidence_timestamptz_matches_v1(
       trust_reference_record.evidence_fields->>'observedAt',
       NEW.observed_at
     )
     OR NOT communication_evidence_timestamptz_matches_v1(
       trust_reference_record.evidence_fields->>'effectiveAt',
       NEW.effective_at
     ) THEN
    RAISE EXCEPTION 'communication consent evidence reference does not match receipt timing';
  END IF;

  IF NOT (trust_reference_record.evidence_fields ? 'expiresAt')
     OR (
       NEW.expires_at IS NULL
       AND trust_reference_record.evidence_fields->'expiresAt' <> 'null'::jsonb
     )
     OR (
       NEW.expires_at IS NOT NULL
       AND NOT communication_evidence_timestamptz_matches_v1(
         trust_reference_record.evidence_fields->>'expiresAt',
         NEW.expires_at
       )
     ) THEN
    RAISE EXCEPTION 'communication consent evidence reference does not match receipt expiry';
  END IF;

  IF NOT (trust_reference_record.evidence_fields ? 'revokedAt')
     OR (
       NEW.revoked_at IS NULL
       AND trust_reference_record.evidence_fields->'revokedAt' <> 'null'::jsonb
     )
     OR (
       NEW.revoked_at IS NOT NULL
       AND NOT communication_evidence_timestamptz_matches_v1(
         trust_reference_record.evidence_fields->>'revokedAt',
         NEW.revoked_at
       )
     ) THEN
    RAISE EXCEPTION 'communication consent evidence reference does not match receipt revocation chronology';
  END IF;

  SELECT * INTO policy_record
    FROM communication_consent_policies
   WHERE tenant_id = NEW.tenant_id
     AND consent_policy_id = NEW.consent_policy_id;

  IF policy_record.consent_policy_id IS NULL
     OR trust_reference_record.evidence_fields->>'policyVersion' <> policy_record.policy_version THEN
    RAISE EXCEPTION 'communication consent evidence reference policy version does not match cited policy';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_consent_evidence_reference ON communication_consent_receipts;
CREATE TRIGGER trg_communication_consent_evidence_reference
  BEFORE INSERT ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_consent_evidence_reference_v1();

CREATE TABLE IF NOT EXISTS communication_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  communication_id TEXT,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'service', 'platform', 'system')),
  actor_user_id TEXT,
  actor_service_id TEXT,
  actor_platform_id TEXT,
  authorization_decision_id TEXT NOT NULL,
  permission_version TEXT NOT NULL CHECK (permission_version = 'communications-permissions-v1'),
  policy_version TEXT NOT NULL CHECK (policy_version = 'communications-policy-v1'),
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
  FOREIGN KEY (actor_service_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id)
    ON DELETE RESTRICT,
  FOREIGN KEY (actor_platform_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id)
    ON DELETE RESTRICT,
  CHECK (
    (actor_type = 'user' AND actor_user_id IS NOT NULL AND actor_service_id IS NULL AND actor_platform_id IS NULL)
    OR (actor_type = 'service' AND actor_user_id IS NULL AND actor_service_id IS NOT NULL AND actor_platform_id IS NULL)
    OR (actor_type = 'platform' AND actor_user_id IS NULL AND actor_service_id IS NULL AND actor_platform_id IS NOT NULL)
    OR (actor_type = 'system' AND actor_user_id IS NULL AND actor_service_id IS NULL AND actor_platform_id IS NOT NULL)
  )
);

DROP TRIGGER IF EXISTS trg_communication_audit_card_scope ON communication_audit_events;
CREATE TRIGGER trg_communication_audit_card_scope
  BEFORE INSERT OR UPDATE ON communication_audit_events
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_reference_card_scope_v1();

CREATE OR REPLACE FUNCTION enforce_communication_audit_actor_evidence_v1()
RETURNS TRIGGER AS $$
DECLARE
  membership_record tenant_memberships%ROWTYPE;
  session_record application_sessions%ROWTYPE;
  grant_record card_access_grants%ROWTYPE;
  service_identity_record trust_crypto_identities%ROWTYPE;
  platform_identity_record trust_crypto_identities%ROWTYPE;
BEGIN
  IF NEW.actor_type = 'user' THEN
    SELECT * INTO membership_record
      FROM tenant_memberships
     WHERE tenant_id = NEW.tenant_id
       AND user_id = NEW.actor_user_id
       AND status = 'active';

    IF membership_record.membership_id IS NULL THEN
      RAISE EXCEPTION 'communication audit user actor requires active tenant membership';
    END IF;

    IF NEW.card_id IS NOT NULL THEN
      SELECT * INTO session_record
        FROM application_sessions
       WHERE session_id = NEW.metadata->>'sessionId'
         AND tenant_id = NEW.tenant_id
         AND user_id = NEW.actor_user_id;

      IF session_record.session_id IS NULL
         OR session_record.revoked_at IS NOT NULL
         OR NEW.occurred_at >= session_record.idle_expires_at
         OR NEW.occurred_at >= session_record.absolute_expires_at THEN
        RAISE EXCEPTION 'communication audit user actor requires an active session';
      END IF;

      SELECT * INTO grant_record
        FROM card_access_grants
       WHERE grant_id = NEW.metadata->>'cardGrantId'
         AND tenant_id = NEW.tenant_id
         AND card_id = NEW.card_id
         AND user_id = NEW.actor_user_id;

      IF grant_record.grant_id IS NULL
         OR grant_record.revoked_at IS NOT NULL
         OR (grant_record.expires_at IS NOT NULL AND NEW.occurred_at >= grant_record.expires_at)
         OR NOT (grant_record.permission_set ? COALESCE(NEW.metadata->>'requiredPermission', '')) THEN
        RAISE EXCEPTION 'communication audit user actor requires an active card grant with required permission';
      END IF;
    END IF;
  ELSIF NEW.actor_type = 'service' THEN
    SELECT * INTO service_identity_record
      FROM trust_crypto_identities
     WHERE tenant_id = NEW.tenant_id
       AND identity_id = NEW.actor_service_id
       AND identity_type = 'service'
       AND status = 'active';

    IF service_identity_record.identity_id IS NULL THEN
      RAISE EXCEPTION 'communication audit service actor requires active service identity';
    END IF;

    IF NOT (
      service_identity_record.metadata ? 'communicationsCapabilities'
      AND service_identity_record.metadata->'communicationsCapabilities' ? 'audit_writer'
    ) THEN
      RAISE EXCEPTION 'communication audit service actor lacks audit writer capability';
    END IF;
  ELSE
    SELECT * INTO platform_identity_record
      FROM trust_crypto_identities
     WHERE tenant_id = NEW.tenant_id
       AND identity_id = NEW.actor_platform_id
       AND identity_type = 'system'
       AND status = 'active';

    IF platform_identity_record.identity_id IS NULL THEN
      RAISE EXCEPTION 'communication audit platform actor requires active platform identity';
    END IF;

    IF NOT (
      platform_identity_record.metadata ? 'communicationsCapabilities'
      AND platform_identity_record.metadata->'communicationsCapabilities' ? 'audit_writer'
    ) THEN
      RAISE EXCEPTION 'communication audit platform actor lacks audit writer capability';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_audit_actor_evidence ON communication_audit_events;
CREATE TRIGGER trg_communication_audit_actor_evidence
  BEFORE INSERT ON communication_audit_events
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_audit_actor_evidence_v1();

CREATE OR REPLACE FUNCTION enforce_communication_command_authorization_decision_v1()
RETURNS TRIGGER AS $$
DECLARE
  decision_record communication_audit_events%ROWTYPE;
BEGIN
  SELECT * INTO decision_record
    FROM communication_audit_events
   WHERE tenant_id = NEW.tenant_id
     AND audit_event_id = NEW.authorization_decision_id
     AND event_type = 'communication.authorization_decision'
     AND result = 'succeeded';

  IF decision_record.audit_event_id IS NULL THEN
    RAISE EXCEPTION 'communication command requires durable authorization decision evidence';
  END IF;

  IF decision_record.permission_version <> NEW.permission_version
     OR decision_record.policy_version <> NEW.policy_version THEN
    RAISE EXCEPTION 'communication command authorization decision version mismatch';
  END IF;

  IF decision_record.metadata->>'operation' <> NEW.operation
     OR decision_record.metadata->>'scopeType' <> NEW.scope_type
     OR decision_record.metadata->>'scopeId' <> NEW.scope_id
     OR decision_record.metadata->>'requiredPermission' <> NEW.required_permission
     OR decision_record.metadata->>'requestHash' <> NEW.request_hash THEN
    RAISE EXCEPTION 'communication command authorization decision resource mismatch';
  END IF;

  IF NEW.scope_type = 'card'
     AND (
       decision_record.metadata->>'sessionId' <> NEW.session_id
       OR decision_record.metadata->>'cardGrantId' <> NEW.card_grant_id
     ) THEN
    RAISE EXCEPTION 'communication command authorization decision user context mismatch';
  END IF;

  IF NEW.scope_type = 'card' AND decision_record.card_id IS DISTINCT FROM NEW.card_id THEN
    RAISE EXCEPTION 'communication command authorization decision card mismatch';
  END IF;

  IF NEW.scope_type <> 'card' AND decision_record.card_id IS NOT NULL THEN
    RAISE EXCEPTION 'communication command tenant/platform authorization decision must be cardless';
  END IF;

  IF NEW.actor_type = 'user'
     AND (
       decision_record.actor_type <> 'user'
       OR decision_record.actor_user_id IS DISTINCT FROM NEW.actor_user_id
     ) THEN
    RAISE EXCEPTION 'communication command user authorization decision actor mismatch';
  END IF;

  IF NEW.actor_type = 'service'
     AND (
       decision_record.actor_type <> 'service'
       OR decision_record.actor_service_id IS DISTINCT FROM NEW.actor_service_id
     ) THEN
    RAISE EXCEPTION 'communication command service authorization decision actor mismatch';
  END IF;

  IF NEW.actor_type = 'platform'
     AND (
       decision_record.actor_type NOT IN ('platform', 'system')
       OR decision_record.actor_platform_id IS DISTINCT FROM NEW.actor_platform_id
     ) THEN
    RAISE EXCEPTION 'communication command platform authorization decision actor mismatch';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_command_authorization_decision ON communication_command_idempotency_keys;
CREATE TRIGGER trg_communication_command_authorization_decision
  BEFORE INSERT ON communication_command_idempotency_keys
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_command_authorization_decision_v1();

ALTER TABLE communication_suppressions
  DROP CONSTRAINT IF EXISTS communication_suppressions_audit_event_fk;

ALTER TABLE communication_suppressions
  ADD CONSTRAINT communication_suppressions_audit_event_fk
  FOREIGN KEY (audit_event_id, tenant_id)
  REFERENCES communication_audit_events(audit_event_id, tenant_id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_communication_suppressions_release_audit_once
  ON communication_suppressions(tenant_id, audit_event_id)
  WHERE audit_event_id IS NOT NULL;

CREATE OR REPLACE FUNCTION enforce_communication_suppression_actor_evidence_v1()
RETURNS TRIGGER AS $$
DECLARE
  creator_membership tenant_memberships%ROWTYPE;
  releaser_membership tenant_memberships%ROWTYPE;
  release_audit_record communication_audit_events%ROWTYPE;
BEGIN
  SELECT * INTO creator_membership
    FROM tenant_memberships
   WHERE tenant_id = NEW.tenant_id
     AND user_id = NEW.created_by_actor_id
     AND status = 'active';

  IF creator_membership.membership_id IS NULL
     OR creator_membership.role = 'viewer' THEN
    RAISE EXCEPTION 'communication suppression creator requires active non-viewer membership';
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status <> 'active' THEN
    RAISE EXCEPTION 'communication suppression rows must be inserted active and released through a controlled transition';
  END IF;

  IF NEW.status = 'released' THEN
    SELECT * INTO releaser_membership
      FROM tenant_memberships
     WHERE tenant_id = NEW.tenant_id
       AND user_id = NEW.released_by_actor_id
       AND status = 'active';

    IF releaser_membership.membership_id IS NULL
       OR releaser_membership.role NOT IN ('tenant_owner', 'tenant_admin', 'receptionist_manager') THEN
      RAISE EXCEPTION 'communication suppression release requires authorized active membership';
    END IF;

    SELECT * INTO release_audit_record
      FROM communication_audit_events
     WHERE tenant_id = NEW.tenant_id
       AND audit_event_id = NEW.audit_event_id
       AND event_type = 'communication.suppression_released'
       AND result = 'succeeded'
       AND card_id IS NOT DISTINCT FROM NEW.card_id
       AND actor_type = 'user'
       AND actor_user_id = NEW.released_by_actor_id;

    IF release_audit_record.audit_event_id IS NULL THEN
      RAISE EXCEPTION 'communication suppression release requires matching release audit evidence';
    END IF;

    IF release_audit_record.metadata->>'suppressionId' <> NEW.suppression_id
       OR release_audit_record.metadata->>'releaseReason' <> NEW.release_reason
       OR release_audit_record.metadata->>'requiredPermission' <> 'communications:release_suppression'
       OR release_audit_record.metadata->>'decisionId' <> release_audit_record.authorization_decision_id THEN
      RAISE EXCEPTION 'communication suppression release audit evidence does not match suppression resource';
    END IF;

    IF release_audit_record.occurred_at < NEW.created_at
       OR release_audit_record.occurred_at > NEW.released_at THEN
      RAISE EXCEPTION 'communication suppression release audit chronology is invalid';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_communication_suppression_transition_v1()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'communication suppression evidence cannot be deleted';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.card_id IS DISTINCT FROM OLD.card_id
       OR NEW.participant_id IS DISTINCT FROM OLD.participant_id
       OR NEW.channel IS DISTINCT FROM OLD.channel
       OR NEW.purpose IS DISTINCT FROM OLD.purpose
       OR NEW.reason_code IS DISTINCT FROM OLD.reason_code
       OR NEW.created_by_actor_id IS DISTINCT FROM OLD.created_by_actor_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
      RAISE EXCEPTION 'communication suppression scope and creation evidence is immutable';
    END IF;

    IF OLD.status <> 'active' OR NEW.status <> 'released' THEN
      RAISE EXCEPTION 'communication suppression update must release one active suppression';
    END IF;

    IF NEW.released_at IS NULL
       OR NEW.released_at < OLD.created_at
       OR NEW.released_by_actor_id IS NULL
       OR NEW.release_reason IS NULL
       OR btrim(NEW.release_reason) = ''
       OR NEW.audit_event_id IS NULL THEN
      RAISE EXCEPTION 'communication suppression release requires actor, reason, time, and audit evidence';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_suppression_actor_evidence ON communication_suppressions;
CREATE TRIGGER trg_communication_suppression_actor_evidence
  BEFORE INSERT OR UPDATE ON communication_suppressions
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_suppression_actor_evidence_v1();

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
  decision_record communication_audit_events%ROWTYPE;
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

  IF NEW.occurred_at < current_communication.updated_at THEN
    RAISE EXCEPTION 'communication lifecycle transition cannot backdate aggregate chronology';
  END IF;

  SELECT * INTO decision_record
    FROM communication_audit_events
   WHERE tenant_id = NEW.tenant_id
     AND audit_event_id = NEW.authorization_decision_id
     AND event_type = 'communication.authorization_decision'
     AND result = 'succeeded'
     AND card_id IS NOT DISTINCT FROM NEW.card_id
     AND communication_id IS NOT DISTINCT FROM NEW.communication_id
     AND actor_type = 'user'
     AND actor_user_id IS NOT DISTINCT FROM NEW.actor_user_id;

  IF decision_record.audit_event_id IS NULL THEN
    RAISE EXCEPTION 'communication lifecycle transition requires durable authorization decision evidence';
  END IF;

  IF decision_record.metadata->>'operation' <> 'advance_lifecycle'
     OR decision_record.metadata->>'resourceType' <> 'communication_lifecycle_transition'
     OR decision_record.metadata->>'communicationId' <> NEW.communication_id
     OR decision_record.metadata->>'fromState' <> NEW.from_state
     OR decision_record.metadata->>'toState' <> NEW.to_state
     OR decision_record.metadata->>'requiredPermission' <> 'communications:advance_lifecycle' THEN
    RAISE EXCEPTION 'communication lifecycle transition authorization decision resource mismatch';
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

  PERFORM set_config('bidayax.communication_lifecycle_transition', 'true', true);

  UPDATE communications
     SET current_state = NEW.to_state,
         state_version = NEW.sequence_number,
         updated_at = NEW.occurred_at
   WHERE tenant_id = NEW.tenant_id
     AND communication_id = NEW.communication_id;

  PERFORM set_config('bidayax.communication_lifecycle_transition', 'false', true);

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

DROP TRIGGER IF EXISTS trg_communication_consent_policies_append_only ON communication_consent_policies;
CREATE TRIGGER trg_communication_consent_policies_append_only
  BEFORE UPDATE OR DELETE ON communication_consent_policies
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

DROP TRIGGER IF EXISTS trg_communication_consent_receipts_append_only ON communication_consent_receipts;
CREATE TRIGGER trg_communication_consent_receipts_append_only
  BEFORE UPDATE OR DELETE ON communication_consent_receipts
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

DROP TRIGGER IF EXISTS trg_communication_suppressions_append_only ON communication_suppressions;
DROP TRIGGER IF EXISTS trg_communication_suppressions_transition ON communication_suppressions;
CREATE TRIGGER trg_communication_suppressions_transition
  BEFORE UPDATE OR DELETE ON communication_suppressions
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_suppression_transition_v1();

CREATE OR REPLACE FUNCTION enforce_communication_command_result_update_v1()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'communication command evidence cannot be deleted';
  END IF;

  IF NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
     OR NEW.card_id IS DISTINCT FROM OLD.card_id
     OR NEW.scope_type IS DISTINCT FROM OLD.scope_type
     OR NEW.scope_id IS DISTINCT FROM OLD.scope_id
     OR NEW.operation IS DISTINCT FROM OLD.operation
     OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
     OR NEW.request_hash IS DISTINCT FROM OLD.request_hash
     OR NEW.actor_type IS DISTINCT FROM OLD.actor_type
     OR NEW.actor_user_id IS DISTINCT FROM OLD.actor_user_id
     OR NEW.actor_service_id IS DISTINCT FROM OLD.actor_service_id
     OR NEW.actor_platform_id IS DISTINCT FROM OLD.actor_platform_id
     OR NEW.session_id IS DISTINCT FROM OLD.session_id
     OR NEW.card_grant_id IS DISTINCT FROM OLD.card_grant_id
     OR NEW.authorization_decision_id IS DISTINCT FROM OLD.authorization_decision_id
     OR NEW.required_permission IS DISTINCT FROM OLD.required_permission
     OR NEW.permission_version IS DISTINCT FROM OLD.permission_version
     OR NEW.policy_version IS DISTINCT FROM OLD.policy_version
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'communication command authorization and request evidence is immutable';
  END IF;

  IF OLD.status <> 'reserved' OR NEW.status NOT IN ('completed', 'failed') THEN
    RAISE EXCEPTION 'communication command result update must move reserved to a terminal command status';
  END IF;

  IF NEW.completed_at IS NULL OR NEW.completed_at < NEW.created_at THEN
    RAISE EXCEPTION 'communication command terminal result requires completed_at after creation';
  END IF;

  IF NEW.status = 'completed'
     AND NEW.operation IN (
       'request_callback', 'cancel_callback', 'schedule_communication',
       'initiate_communication', 'accept_inbound_communication_event',
       'escalate_to_human', 'terminate_communication'
     )
     AND NEW.result_communication_id IS NULL THEN
    RAISE EXCEPTION 'communication command completion requires result communication id for communication-producing operation';
  END IF;

  IF NEW.status = 'completed'
     AND NEW.operation NOT IN (
       'request_callback', 'cancel_callback', 'schedule_communication',
       'initiate_communication', 'accept_inbound_communication_event',
       'escalate_to_human', 'terminate_communication'
     )
     AND NEW.result_communication_id IS NOT NULL THEN
    RAISE EXCEPTION 'communication command completion cannot carry result communication id for non-communication operation';
  END IF;

  IF NEW.status = 'failed' AND NEW.result_communication_id IS NOT NULL THEN
    RAISE EXCEPTION 'communication command failure cannot carry a result communication id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_communication_command_idempotency_result_update ON communication_command_idempotency_keys;
CREATE TRIGGER trg_communication_command_idempotency_result_update
  BEFORE UPDATE OR DELETE ON communication_command_idempotency_keys
  FOR EACH ROW EXECUTE FUNCTION enforce_communication_command_result_update_v1();

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

DROP TRIGGER IF EXISTS trg_communication_summary_append_only ON communication_summaries;
CREATE TRIGGER trg_communication_summary_append_only
  BEFORE UPDATE OR DELETE ON communication_summaries
  FOR EACH ROW EXECUTE FUNCTION prevent_communication_evidence_mutation_v1();

DROP TRIGGER IF EXISTS trg_communication_failover_append_only ON communication_failover_events;
CREATE TRIGGER trg_communication_failover_append_only
  BEFORE UPDATE OR DELETE ON communication_failover_events
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
