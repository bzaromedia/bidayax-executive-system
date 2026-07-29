CREATE OR REPLACE FUNCTION communication_metadata_value_is_safe_v1(field_name TEXT, field_value JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  text_value TEXT;
BEGIN
  IF field_value IS NULL THEN
    RETURN TRUE;
  END IF;

  IF jsonb_typeof(field_value) IN ('object', 'array') THEN
    IF field_name = '' THEN
      RETURN communication_metadata_is_safe_v1(field_value);
    END IF;

    RETURN FALSE;
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

CREATE OR REPLACE FUNCTION enforce_communication_authorization_evidence_v1()
RETURNS TRIGGER AS $$
DECLARE
  membership_record tenant_memberships%ROWTYPE;
  session_record application_sessions%ROWTYPE;
  grant_record card_access_grants%ROWTYPE;
  service_identity_record trust_crypto_identities%ROWTYPE;
  platform_identity_record trust_crypto_identities%ROWTYPE;
  evaluation_time TIMESTAMPTZ := clock_timestamp();
BEGIN
  NEW.created_at := evaluation_time;

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
     OR evaluation_time >= session_record.idle_expires_at
     OR evaluation_time >= session_record.absolute_expires_at THEN
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
       OR (grant_record.expires_at IS NOT NULL AND evaluation_time >= grant_record.expires_at) THEN
      RAISE EXCEPTION 'communication command grant is not active';
    END IF;

    IF NOT (grant_record.permission_set ? NEW.required_permission) THEN
      RAISE EXCEPTION 'communication command grant lacks required permission';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

  IF NEW.envelope_id IS NULL THEN
    RAISE EXCEPTION 'communication trust reference requires a cryptographic envelope';
  END IF;

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
     OR NOT (trust_event_record.details ? 'envelopeId')
     OR trust_event_record.details->>'envelopeId' IS DISTINCT FROM NEW.envelope_id THEN
    RAISE EXCEPTION 'communication trust event is incompatible';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

  IF NOT (trust_reference_record.evidence_fields ? 'consentReceiptId')
     OR NOT (trust_reference_record.evidence_fields ? 'channel')
     OR NOT (trust_reference_record.evidence_fields ? 'purpose')
     OR NOT (trust_reference_record.evidence_fields ? 'participantId')
     OR NOT (trust_reference_record.evidence_fields ? 'consentPolicyId')
     OR NOT (trust_reference_record.evidence_fields ? 'status')
     OR NOT (trust_reference_record.evidence_fields ? 'source')
     OR NOT (trust_reference_record.evidence_fields ? 'policyVersion')
     OR trust_reference_record.evidence_fields->>'consentReceiptId' IS DISTINCT FROM NEW.consent_receipt_id
     OR trust_reference_record.evidence_fields->>'channel' IS DISTINCT FROM NEW.channel
     OR trust_reference_record.evidence_fields->>'purpose' IS DISTINCT FROM NEW.purpose
     OR trust_reference_record.evidence_fields->>'participantId' IS DISTINCT FROM NEW.participant_id
     OR trust_reference_record.evidence_fields->>'consentPolicyId' IS DISTINCT FROM NEW.consent_policy_id
     OR trust_reference_record.evidence_fields->>'status' IS DISTINCT FROM NEW.status
     OR trust_reference_record.evidence_fields->>'source' IS DISTINCT FROM NEW.source THEN
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
     OR trust_reference_record.evidence_fields->>'policyVersion' IS DISTINCT FROM policy_record.policy_version THEN
    RAISE EXCEPTION 'communication consent evidence reference policy version does not match cited policy';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

  NEW.completed_at := clock_timestamp();

  IF NEW.completed_at < NEW.created_at THEN
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

  IF NOT (decision_record.metadata ? 'operation')
     OR NOT (decision_record.metadata ? 'scopeType')
     OR NOT (decision_record.metadata ? 'scopeId')
     OR NOT (decision_record.metadata ? 'requiredPermission')
     OR NOT (decision_record.metadata ? 'requestHash')
     OR decision_record.metadata->>'operation' IS DISTINCT FROM NEW.operation
     OR decision_record.metadata->>'scopeType' IS DISTINCT FROM NEW.scope_type
     OR decision_record.metadata->>'scopeId' IS DISTINCT FROM NEW.scope_id
     OR decision_record.metadata->>'requiredPermission' IS DISTINCT FROM NEW.required_permission
     OR decision_record.metadata->>'requestHash' IS DISTINCT FROM NEW.request_hash THEN
    RAISE EXCEPTION 'communication command authorization decision resource mismatch';
  END IF;

  IF NEW.actor_type = 'user'
     AND (
       NOT (decision_record.metadata ? 'sessionId')
       OR decision_record.metadata->>'sessionId' IS DISTINCT FROM NEW.session_id
     ) THEN
    RAISE EXCEPTION 'communication command authorization decision user context mismatch';
  END IF;

  IF NEW.scope_type = 'card'
     AND (
       NOT (decision_record.metadata ? 'cardGrantId')
       OR decision_record.metadata->>'cardGrantId' IS DISTINCT FROM NEW.card_grant_id
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
