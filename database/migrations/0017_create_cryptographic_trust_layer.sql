CREATE TABLE IF NOT EXISTS trust_algorithm_registry (
  algorithm_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('digest', 'signature', 'aead', 'kdf', 'mac', 'password-hash', 'post-quantum-hook')),
  policy_version TEXT NOT NULL CHECK (policy_version = 'trust-algorithm-policy-1'),
  status TEXT NOT NULL CHECK (status IN ('approved', 'disabled', 'type-hook-only')),
  allowed_contexts JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(allowed_contexts) = 'array'),
  requires_explicit_approval BOOLEAN NOT NULL,
  built_in_implementation_available BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (algorithm_name, operation, policy_version),
  UNIQUE (algorithm_name, operation)
);

INSERT INTO trust_algorithm_registry (
  algorithm_name, operation, policy_version, status, allowed_contexts,
  requires_explicit_approval, built_in_implementation_available, notes
) VALUES
  ('SHA-256', 'digest', 'trust-algorithm-policy-1', 'approved', '["artifact-digest", "internal-high-throughput-digest"]', FALSE, TRUE, 'Default digest.'),
  ('SHA-512/256', 'digest', 'trust-algorithm-policy-1', 'approved', '["artifact-digest", "internal-high-throughput-digest"]', FALSE, FALSE, 'Approved provider hook; no built-in implementation.'),
  ('SHA3-256', 'digest', 'trust-algorithm-policy-1', 'approved', '["artifact-digest"]', TRUE, FALSE, 'Explicit approval required; no built-in implementation.'),
  ('BLAKE3', 'digest', 'trust-algorithm-policy-1', 'approved', '["internal-high-throughput-digest"]', TRUE, FALSE, 'Approved internal high-throughput use only; no built-in implementation.'),
  ('Ed25519', 'signature', 'trust-algorithm-policy-1', 'approved', '["platform-signature", "tenant-signature", "audit-signature", "provenance-signature", "agent-message-signature", "capital-document-signature"]', FALSE, TRUE, 'Preferred signature algorithm.'),
  ('ECDSA-P256-SHA256', 'signature', 'trust-algorithm-policy-1', 'approved', '["interop-signature"]', TRUE, FALSE, 'Interop only; no built-in implementation.'),
  ('AES-256-GCM', 'aead', 'trust-algorithm-policy-1', 'approved', '["encryption-at-rest", "encryption-in-transit"]', FALSE, FALSE, 'Provider interface only.'),
  ('XChaCha20-Poly1305', 'aead', 'trust-algorithm-policy-1', 'approved', '["encryption-at-rest", "encryption-in-transit"]', FALSE, FALSE, 'Provider interface only.'),
  ('HKDF-SHA-256', 'kdf', 'trust-algorithm-policy-1', 'approved', '["key-derivation"]', FALSE, FALSE, 'Provider interface only.'),
  ('HMAC-SHA-256', 'mac', 'trust-algorithm-policy-1', 'approved', '["message-authentication"]', FALSE, FALSE, 'Provider interface only.'),
  ('Argon2id', 'password-hash', 'trust-algorithm-policy-1', 'approved', '["password-hashing"]', FALSE, FALSE, 'Provider interface only.'),
  ('MD5', 'digest', 'trust-algorithm-policy-1', 'disabled', '[]', FALSE, FALSE, 'Prohibited.'),
  ('SHA-1', 'digest', 'trust-algorithm-policy-1', 'disabled', '[]', FALSE, FALSE, 'Prohibited.'),
  ('AES-ECB', 'aead', 'trust-algorithm-policy-1', 'disabled', '[]', FALSE, FALSE, 'ECB and unauthenticated encryption are prohibited.'),
  ('ML-KEM', 'post-quantum-hook', 'trust-algorithm-policy-1', 'type-hook-only', '[]', TRUE, FALSE, 'Type hook only; no post-quantum claim or implementation.'),
  ('ML-DSA', 'post-quantum-hook', 'trust-algorithm-policy-1', 'type-hook-only', '[]', TRUE, FALSE, 'Type hook only; no post-quantum claim or implementation.'),
  ('SLH-DSA', 'post-quantum-hook', 'trust-algorithm-policy-1', 'type-hook-only', '[]', TRUE, FALSE, 'Type hook only; no post-quantum claim or implementation.')
ON CONFLICT (algorithm_name, operation, policy_version) DO NOTHING;

CREATE TABLE IF NOT EXISTS trust_crypto_identities (
  identity_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  identity_type TEXT NOT NULL CHECK (identity_type IN ('user', 'service', 'agent', 'system')),
  display_name TEXT NOT NULL CHECK (length(display_name) > 0),
  status TEXT NOT NULL CHECK (status IN ('active', 'disabled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL CHECK (updated_at >= created_at),
  UNIQUE (identity_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS trust_keys (
  key_id TEXT NOT NULL,
  key_version INTEGER NOT NULL CHECK (key_version > 0),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  identity_id TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  operation TEXT NOT NULL DEFAULT 'signature' CHECK (operation = 'signature'),
  public_key TEXT NOT NULL CHECK (public_key ~ '^[A-Za-z0-9_-]+$'),
  public_key_encoding TEXT NOT NULL CHECK (public_key_encoding = 'spki-der-base64url'),
  purpose TEXT NOT NULL CHECK (purpose IN (
    'platform_artifact_signing', 'tenant_artifact_signing', 'settings_signing',
    'audit_chain_signing', 'provenance_signing', 'capital_document_signing',
    'agent_message_signing', 'verification_only'
  )),
  scope_id TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('kms', 'hsm', 'remote-signer')),
  provider_key_reference TEXT NOT NULL CHECK (length(provider_key_reference) > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'retiring', 'retired', 'revoked', 'compromised')),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ NOT NULL,
  replaces_key_id TEXT,
  replaces_key_version INTEGER,
  revoked_at TIMESTAMPTZ,
  compromised_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, key_id, key_version),
  UNIQUE (tenant_id, key_id, key_version, purpose),
  UNIQUE (tenant_id, provider_type, provider_key_reference, key_version),
  FOREIGN KEY (identity_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (algorithm, operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, replaces_key_id, replaces_key_version)
    REFERENCES trust_keys(tenant_id, key_id, key_version) ON DELETE RESTRICT,
  CHECK ((replaces_key_id IS NULL) = (replaces_key_version IS NULL)),
  CHECK (valid_until IS NULL OR valid_until >= valid_from),
  CHECK (status NOT IN ('retiring', 'retired') OR valid_until IS NOT NULL),
  CHECK (
    (status IN ('pending', 'active', 'retiring', 'retired') AND revoked_at IS NULL AND compromised_at IS NULL)
    OR (status = 'revoked' AND revoked_at IS NOT NULL AND compromised_at IS NULL)
    OR (status = 'compromised' AND compromised_at IS NOT NULL)
  ),
  CHECK (public_key !~* '(private[ _-]?key|begin)')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_keys_active_scope
  ON trust_keys(tenant_id, purpose, scope_id)
  WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_keys_replacement
  ON trust_keys(tenant_id, replaces_key_id, replaces_key_version)
  WHERE replaces_key_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_key_revocations (
  revocation_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  key_id TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  revocation_type TEXT NOT NULL CHECK (revocation_type IN ('revoked', 'compromised')),
  reason_code TEXT NOT NULL CHECK (length(reason_code) > 0),
  effective_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL CHECK (recorded_at >= effective_at),
  actor_identity_id TEXT,
  idempotency_key TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, key_id, key_version, revocation_type, effective_at),
  FOREIGN KEY (tenant_id, key_id, key_version)
    REFERENCES trust_keys(tenant_id, key_id, key_version) ON DELETE RESTRICT,
  FOREIGN KEY (actor_identity_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS trust_signed_actions (
  action_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  actor_identity_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  key_id TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  key_purpose TEXT NOT NULL,
  signature_algorithm TEXT NOT NULL,
  signature_operation TEXT NOT NULL DEFAULT 'signature' CHECK (signature_operation = 'signature'),
  signed_at TIMESTAMPTZ NOT NULL,
  signature TEXT NOT NULL CHECK (signature ~ '^[A-Za-z0-9_-]+$'),
  UNIQUE (action_id, tenant_id),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (actor_identity_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, key_id, key_version, key_purpose)
    REFERENCES trust_keys(tenant_id, key_id, key_version, purpose) ON DELETE RESTRICT,
  FOREIGN KEY (signature_algorithm, signature_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  CHECK (key_purpose IN (
    'platform_artifact_signing', 'tenant_artifact_signing', 'settings_signing',
    'audit_chain_signing', 'provenance_signing', 'capital_document_signing',
    'agent_message_signing', 'verification_only'
  ))
);

CREATE TABLE IF NOT EXISTS trust_events (
  event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  stream_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  provenance_lifecycle TEXT CHECK (provenance_lifecycle IN (
    'created', 'edited', 'classified', 'redacted', 'translated', 'published',
    'archived', 'superseded', 'exported', 'deleted', 'restored'
  )),
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  actor_identity_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  idempotency_key TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  UNIQUE (event_id, tenant_id),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (actor_identity_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS trust_provenance_manifests (
  manifest_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  artifact_type TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  artifact_version TEXT NOT NULL,
  artifact_digest TEXT NOT NULL CHECK (artifact_digest ~ '^[0-9a-f]{64}$'),
  links JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(links) = 'array'),
  lifecycle_events JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(lifecycle_events) = 'array'),
  manifest_digest TEXT NOT NULL CHECK (manifest_digest ~ '^[0-9a-f]{64}$'),
  schema_version TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT TRUE CHECK (immutable = TRUE),
  UNIQUE (manifest_id, tenant_id),
  UNIQUE (tenant_id, artifact_type, artifact_id, artifact_version, manifest_digest)
);

CREATE TABLE IF NOT EXISTS cryptographic_envelopes (
  envelope_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  envelope_version TEXT NOT NULL CHECK (envelope_version = '1'),
  card_id TEXT,
  artifact_type TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  artifact_version TEXT NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN (
    'settings.snapshot', 'brand.tokens.snapshot', 'identity.audit', 'identity.session',
    'identity.authorization', 'telephony.audit', 'telephony.usage', 'telephony.safety',
    'receptionist.runtime', 'receptionist.consent', 'receptionist.retention',
    'receptionist.redaction', 'receptionist.safety', 'receptionist.tool_authorization',
    'governance.legal_hold', 'governance.erasure_receipt', 'governance.kill_switch',
    'capital.document', 'capital.disclosure', 'capital.consent', 'provenance.manifest',
    'watermark.asset', 'watermark.package', 'sentinelq.evidence'
  )),
  schema_version TEXT NOT NULL,
  canonicalization_version TEXT NOT NULL CHECK (canonicalization_version = 'bidayax-c14n-1'),
  algorithm_policy_version TEXT NOT NULL CHECK (algorithm_policy_version = 'trust-algorithm-policy-1'),
  digest_algorithm TEXT NOT NULL,
  digest_operation TEXT NOT NULL DEFAULT 'digest' CHECK (digest_operation = 'digest'),
  digest TEXT NOT NULL CHECK (digest ~ '^[0-9a-f]{64}$'),
  signature_algorithm TEXT NOT NULL,
  signature_operation TEXT NOT NULL DEFAULT 'signature' CHECK (signature_operation = 'signature'),
  key_id TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  key_purpose TEXT NOT NULL,
  signer_type TEXT NOT NULL CHECK (signer_type IN ('platform', 'tenant', 'agent', 'system')),
  signer_id TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  previous_envelope_id TEXT,
  previous_digest TEXT,
  provenance_manifest_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  status TEXT NOT NULL CHECK (status IN ('active', 'superseded', 'revoked')),
  payload JSONB NOT NULL,
  signature TEXT NOT NULL CHECK (signature ~ '^[A-Za-z0-9_-]+$'),
  immutable BOOLEAN NOT NULL DEFAULT TRUE CHECK (immutable = TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (envelope_id, tenant_id),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, key_id, key_version, key_purpose)
    REFERENCES trust_keys(tenant_id, key_id, key_version, purpose) ON DELETE RESTRICT,
  FOREIGN KEY (digest_algorithm, digest_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  FOREIGN KEY (signature_algorithm, signature_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  FOREIGN KEY (previous_envelope_id, tenant_id)
    REFERENCES cryptographic_envelopes(envelope_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (provenance_manifest_id, tenant_id)
    REFERENCES trust_provenance_manifests(manifest_id, tenant_id) ON DELETE RESTRICT,
  CHECK ((previous_envelope_id IS NULL) = (previous_digest IS NULL)),
  CHECK (previous_digest IS NULL OR previous_digest ~ '^[0-9a-f]{64}$'),
  CHECK (expires_at IS NULL OR expires_at > signed_at)
);

CREATE TABLE IF NOT EXISTS trust_audit_chain_entries (
  entry_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  stream_id TEXT NOT NULL,
  sequence_number BIGINT NOT NULL CHECK (sequence_number > 0),
  previous_digest TEXT,
  event_id TEXT NOT NULL,
  event_payload JSONB NOT NULL CHECK (jsonb_typeof(event_payload) = 'object'),
  event_digest TEXT NOT NULL CHECK (event_digest ~ '^[0-9a-f]{64}$'),
  entry_digest TEXT NOT NULL CHECK (entry_digest ~ '^[0-9a-f]{64}$'),
  checkpoint_sequence BIGINT,
  checkpoint_digest TEXT,
  appended_at TIMESTAMPTZ NOT NULL,
  UNIQUE (entry_id, tenant_id),
  UNIQUE (tenant_id, stream_id, sequence_number),
  UNIQUE (tenant_id, stream_id, event_id),
  UNIQUE (tenant_id, stream_id, event_digest),
  UNIQUE (tenant_id, stream_id, entry_digest),
  FOREIGN KEY (event_id, tenant_id)
    REFERENCES trust_events(event_id, tenant_id) ON DELETE RESTRICT,
  CHECK ((checkpoint_sequence IS NULL) = (checkpoint_digest IS NULL)),
  CHECK (previous_digest IS NULL OR previous_digest ~ '^[0-9a-f]{64}$'),
  CHECK (checkpoint_digest IS NULL OR checkpoint_digest ~ '^[0-9a-f]{64}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_audit_chain_no_forks
  ON trust_audit_chain_entries(tenant_id, stream_id, previous_digest)
  WHERE previous_digest IS NOT NULL;

CREATE TABLE IF NOT EXISTS trust_merkle_batches (
  batch_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  leaf_digests JSONB NOT NULL CHECK (jsonb_typeof(leaf_digests) = 'array'),
  leaf_count BIGINT NOT NULL CHECK (leaf_count > 0),
  root_digest TEXT NOT NULL CHECK (root_digest ~ '^[0-9a-f]{64}$'),
  digest_algorithm TEXT NOT NULL CHECK (digest_algorithm = 'SHA-256'),
  digest_operation TEXT NOT NULL DEFAULT 'digest' CHECK (digest_operation = 'digest'),
  duplicate_policy TEXT NOT NULL CHECK (duplicate_policy = 'reject'),
  odd_node_policy TEXT NOT NULL CHECK (odd_node_policy = 'duplicate_last'),
  root_key_id TEXT,
  root_key_version INTEGER,
  root_key_purpose TEXT CHECK (root_key_purpose = 'audit_chain_signing'),
  root_signature_algorithm TEXT,
  root_signature_operation TEXT CHECK (root_signature_operation = 'signature'),
  root_signature TEXT,
  root_signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT TRUE CHECK (immutable = TRUE),
  UNIQUE (batch_id, tenant_id),
  UNIQUE (batch_id, tenant_id, root_digest),
  UNIQUE (tenant_id, root_digest),
  FOREIGN KEY (digest_algorithm, digest_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, root_key_id, root_key_version, root_key_purpose)
    REFERENCES trust_keys(tenant_id, key_id, key_version, purpose) ON DELETE RESTRICT,
  FOREIGN KEY (root_signature_algorithm, root_signature_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  CHECK ((root_key_id IS NULL) = (root_key_version IS NULL)),
  CHECK ((root_key_id IS NULL) = (root_key_purpose IS NULL)),
  CHECK ((root_key_id IS NULL) = (root_signature_algorithm IS NULL)),
  CHECK ((root_key_id IS NULL) = (root_signature_operation IS NULL)),
  CHECK ((root_key_id IS NULL) = (root_signature IS NULL)),
  CHECK ((root_key_id IS NULL) = (root_signed_at IS NULL)),
  CHECK (root_signature IS NULL OR root_signature ~ '^[A-Za-z0-9_-]+$')
);

CREATE TABLE IF NOT EXISTS trust_merkle_proofs (
  proof_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  proof_version TEXT NOT NULL CHECK (proof_version = '1'),
  batch_id TEXT NOT NULL,
  leaf_index BIGINT NOT NULL CHECK (leaf_index >= 0),
  leaf_digest TEXT NOT NULL CHECK (leaf_digest ~ '^[0-9a-f]{64}$'),
  root_digest TEXT NOT NULL CHECK (root_digest ~ '^[0-9a-f]{64}$'),
  digest_algorithm TEXT NOT NULL DEFAULT 'SHA-256' CHECK (digest_algorithm = 'SHA-256'),
  digest_operation TEXT NOT NULL DEFAULT 'digest' CHECK (digest_operation = 'digest'),
  proof_steps JSONB NOT NULL CHECK (jsonb_typeof(proof_steps) = 'array'),
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (proof_id, tenant_id),
  UNIQUE (tenant_id, idempotency_key),
  UNIQUE (tenant_id, batch_id, leaf_index),
  UNIQUE (tenant_id, batch_id, proof_version, leaf_index, leaf_digest),
  FOREIGN KEY (digest_algorithm, digest_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id, tenant_id)
    REFERENCES trust_merkle_batches(batch_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id, tenant_id, root_digest)
    REFERENCES trust_merkle_batches(batch_id, tenant_id, root_digest) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS trust_verification_receipts (
  receipt_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  envelope_id TEXT NOT NULL,
  verifier_identity_id TEXT,
  verified_at TIMESTAMPTZ NOT NULL,
  valid BOOLEAN NOT NULL,
  components JSONB NOT NULL CHECK (jsonb_typeof(components) = 'object'),
  reason_codes JSONB NOT NULL CHECK (jsonb_typeof(reason_codes) = 'array'),
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(warnings) = 'array'),
  idempotency_key TEXT NOT NULL,
  UNIQUE (receipt_id, tenant_id),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (envelope_id, tenant_id)
    REFERENCES cryptographic_envelopes(envelope_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (verifier_identity_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS trust_agent_message_proofs (
  proof_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
  structure_version TEXT NOT NULL CHECK (structure_version = '1'),
  message_id TEXT NOT NULL,
  sender_identity_id TEXT NOT NULL,
  recipient_identity_id TEXT NOT NULL,
  message_digest TEXT NOT NULL CHECK (message_digest ~ '^[0-9a-f]{64}$'),
  digest_algorithm TEXT NOT NULL CHECK (digest_algorithm = 'SHA-256'),
  digest_operation TEXT NOT NULL DEFAULT 'digest' CHECK (digest_operation = 'digest'),
  sent_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  key_id TEXT NOT NULL,
  key_version INTEGER NOT NULL,
  key_purpose TEXT NOT NULL DEFAULT 'agent_message_signing' CHECK (key_purpose = 'agent_message_signing'),
  signature_algorithm TEXT NOT NULL,
  signature_operation TEXT NOT NULL DEFAULT 'signature' CHECK (signature_operation = 'signature'),
  signature TEXT NOT NULL CHECK (signature ~ '^[A-Za-z0-9_-]+$'),
  idempotency_key TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL CHECK (recorded_at >= sent_at),
  UNIQUE (proof_id, tenant_id),
  UNIQUE (tenant_id, message_id, sender_identity_id),
  UNIQUE (tenant_id, idempotency_key),
  FOREIGN KEY (sender_identity_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (recipient_identity_id, tenant_id)
    REFERENCES trust_crypto_identities(identity_id, tenant_id) ON DELETE RESTRICT,
  FOREIGN KEY (tenant_id, key_id, key_version, key_purpose)
    REFERENCES trust_keys(tenant_id, key_id, key_version, purpose) ON DELETE RESTRICT,
  FOREIGN KEY (digest_algorithm, digest_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT,
  FOREIGN KEY (signature_algorithm, signature_operation)
    REFERENCES trust_algorithm_registry(algorithm_name, operation) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_trust_identities_tenant_status
  ON trust_crypto_identities(tenant_id, status, identity_type);
CREATE INDEX IF NOT EXISTS idx_trust_keys_tenant_scope
  ON trust_keys(tenant_id, purpose, scope_id, status, key_version DESC);
CREATE INDEX IF NOT EXISTS idx_trust_revocations_key_time
  ON trust_key_revocations(tenant_id, key_id, key_version, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_events_subject_time
  ON trust_events(tenant_id, subject_type, subject_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_envelopes_artifact
  ON cryptographic_envelopes(tenant_id, artifact_type, artifact_id, artifact_version);
CREATE INDEX IF NOT EXISTS idx_trust_audit_stream
  ON trust_audit_chain_entries(tenant_id, stream_id, sequence_number DESC);
CREATE INDEX IF NOT EXISTS idx_trust_provenance_artifact
  ON trust_provenance_manifests(tenant_id, artifact_type, artifact_id, artifact_version);
CREATE INDEX IF NOT EXISTS idx_trust_merkle_created
  ON trust_merkle_batches(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_merkle_proofs_lookup
  ON trust_merkle_proofs(tenant_id, batch_id, leaf_digest, leaf_index, proof_version);

CREATE OR REPLACE FUNCTION enforce_trust_key_lifecycle_v1()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'trust keys cannot be deleted';
  END IF;
  IF NEW.key_id <> OLD.key_id OR NEW.key_version <> OLD.key_version
    OR NEW.tenant_id <> OLD.tenant_id OR NEW.identity_id <> OLD.identity_id
    OR NEW.algorithm <> OLD.algorithm OR NEW.public_key <> OLD.public_key
    OR NEW.public_key_encoding <> OLD.public_key_encoding OR NEW.purpose <> OLD.purpose
    OR NEW.scope_id <> OLD.scope_id OR NEW.provider_type <> OLD.provider_type
    OR NEW.provider_key_reference <> OLD.provider_key_reference
    OR NEW.valid_from <> OLD.valid_from
    OR (NEW.valid_until IS DISTINCT FROM OLD.valid_until AND NOT (
      OLD.status = 'active' AND NEW.status = 'retiring'
      AND NEW.valid_until = NEW.status_changed_at
    ))
    OR NEW.replaces_key_id IS DISTINCT FROM OLD.replaces_key_id
    OR NEW.replaces_key_version IS DISTINCT FROM OLD.replaces_key_version
    OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'trust key public/provider metadata is immutable';
  END IF;
  IF NOT (
    (OLD.status = 'pending' AND NEW.status IN ('active', 'revoked', 'compromised'))
    OR (OLD.status = 'active' AND NEW.status IN ('retiring', 'revoked', 'compromised'))
    OR (OLD.status = 'retiring' AND NEW.status IN ('retired', 'revoked', 'compromised'))
    OR (OLD.status = 'retired' AND NEW.status IN ('revoked', 'compromised'))
    OR (OLD.status = 'revoked' AND NEW.status = 'compromised')
  ) THEN
    RAISE EXCEPTION 'invalid trust key lifecycle transition from % to %', OLD.status, NEW.status;
  END IF;
  IF NEW.status_changed_at <= OLD.status_changed_at THEN
    RAISE EXCEPTION 'key lifecycle timestamp must increase';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_trust_key_registration_v1()
RETURNS TRIGGER AS $$
DECLARE
  predecessor trust_keys%ROWTYPE;
BEGIN
  IF NEW.replaces_key_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT * INTO predecessor FROM trust_keys
   WHERE key_id = NEW.replaces_key_id
     AND key_version = NEW.replaces_key_version
     AND tenant_id = NEW.tenant_id
   FOR KEY SHARE;
  IF predecessor.key_id IS NULL OR predecessor.status <> 'retiring'
    OR NEW.status <> 'pending' OR NEW.key_version <> predecessor.key_version + 1
    OR NEW.identity_id <> predecessor.identity_id OR NEW.purpose <> predecessor.purpose
    OR NEW.scope_id <> predecessor.scope_id THEN
    RAISE EXCEPTION 'replacement registration must transactionally follow the retiring predecessor';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_trust_revocation_evidence_v1()
RETURNS TRIGGER AS $$
DECLARE
  current_key trust_keys%ROWTYPE;
BEGIN
  SELECT * INTO current_key FROM trust_keys
   WHERE key_id = NEW.key_id AND key_version = NEW.key_version AND tenant_id = NEW.tenant_id
   FOR KEY SHARE;
  IF current_key.status <> NEW.revocation_type
    OR (NEW.revocation_type = 'revoked' AND current_key.revoked_at IS DISTINCT FROM NEW.effective_at)
    OR (NEW.revocation_type = 'compromised' AND current_key.compromised_at IS DISTINCT FROM NEW.effective_at) THEN
    RAISE EXCEPTION 'revocation evidence must match key lifecycle state';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_trust_audit_append_v1()
RETURNS TRIGGER AS $$
DECLARE
  prior trust_audit_chain_entries%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.tenant_id || ':' || NEW.stream_id, 0));
  SELECT * INTO prior FROM trust_audit_chain_entries
   WHERE tenant_id = NEW.tenant_id AND stream_id = NEW.stream_id
   ORDER BY sequence_number DESC LIMIT 1 FOR UPDATE;
  IF prior.entry_id IS NULL THEN
    IF NEW.checkpoint_sequence IS NULL AND (NEW.sequence_number <> 1 OR NEW.previous_digest IS NOT NULL) THEN
      RAISE EXCEPTION 'audit genesis must begin at sequence 1';
    END IF;
    IF NEW.checkpoint_sequence IS NOT NULL AND (
      NEW.sequence_number <> NEW.checkpoint_sequence + 1
      OR NEW.previous_digest IS DISTINCT FROM NEW.checkpoint_digest
    ) THEN
      RAISE EXCEPTION 'audit checkpoint linkage is invalid';
    END IF;
  ELSIF NEW.sequence_number <> prior.sequence_number + 1
    OR NEW.previous_digest IS DISTINCT FROM prior.entry_digest THEN
    RAISE EXCEPTION 'audit append would create a gap or fork';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_trust_evidence_mutation_v1()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'trust evidence is immutable and append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trust_key_registration ON trust_keys;
CREATE TRIGGER trg_trust_key_registration BEFORE INSERT ON trust_keys
  FOR EACH ROW EXECUTE FUNCTION enforce_trust_key_registration_v1();
DROP TRIGGER IF EXISTS trg_trust_key_lifecycle ON trust_keys;
CREATE TRIGGER trg_trust_key_lifecycle BEFORE UPDATE OR DELETE ON trust_keys
  FOR EACH ROW EXECUTE FUNCTION enforce_trust_key_lifecycle_v1();
DROP TRIGGER IF EXISTS trg_trust_revocation_evidence ON trust_key_revocations;
CREATE TRIGGER trg_trust_revocation_evidence BEFORE INSERT ON trust_key_revocations
  FOR EACH ROW EXECUTE FUNCTION enforce_trust_revocation_evidence_v1();
DROP TRIGGER IF EXISTS trg_trust_audit_append ON trust_audit_chain_entries;
CREATE TRIGGER trg_trust_audit_append BEFORE INSERT ON trust_audit_chain_entries
  FOR EACH ROW EXECUTE FUNCTION enforce_trust_audit_append_v1();

DROP TRIGGER IF EXISTS trg_trust_revocations_append_only ON trust_key_revocations;
CREATE TRIGGER trg_trust_revocations_append_only BEFORE UPDATE OR DELETE ON trust_key_revocations FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_actions_immutable ON trust_signed_actions;
CREATE TRIGGER trg_trust_actions_immutable BEFORE UPDATE OR DELETE ON trust_signed_actions FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_events_append_only ON trust_events;
CREATE TRIGGER trg_trust_events_append_only BEFORE UPDATE OR DELETE ON trust_events FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_envelopes_immutable ON cryptographic_envelopes;
CREATE TRIGGER trg_trust_envelopes_immutable BEFORE UPDATE OR DELETE ON cryptographic_envelopes FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_audit_append_only ON trust_audit_chain_entries;
CREATE TRIGGER trg_trust_audit_append_only BEFORE UPDATE OR DELETE ON trust_audit_chain_entries FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_merkle_immutable ON trust_merkle_batches;
CREATE TRIGGER trg_trust_merkle_immutable BEFORE UPDATE OR DELETE ON trust_merkle_batches FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_merkle_proofs_append_only ON trust_merkle_proofs;
CREATE TRIGGER trg_trust_merkle_proofs_append_only BEFORE UPDATE OR DELETE ON trust_merkle_proofs FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_provenance_immutable ON trust_provenance_manifests;
CREATE TRIGGER trg_trust_provenance_immutable BEFORE UPDATE OR DELETE ON trust_provenance_manifests FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_receipts_append_only ON trust_verification_receipts;
CREATE TRIGGER trg_trust_receipts_append_only BEFORE UPDATE OR DELETE ON trust_verification_receipts FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();
DROP TRIGGER IF EXISTS trg_trust_agent_proofs_append_only ON trust_agent_message_proofs;
CREATE TRIGGER trg_trust_agent_proofs_append_only BEFORE UPDATE OR DELETE ON trust_agent_message_proofs FOR EACH ROW EXECUTE FUNCTION prevent_trust_evidence_mutation_v1();

COMMENT ON TABLE trust_algorithm_registry IS 'Versioned policy registry; availability flags do not claim implementations beyond SHA-256 and Ed25519.';
COMMENT ON TABLE trust_keys IS 'Public keys and opaque provider references only; private key persistence, logging, and browser custody are prohibited.';
COMMENT ON TABLE cryptographic_envelopes IS 'Immutable signed artifact envelopes; corrections create a linked new envelope.';
COMMENT ON TABLE trust_audit_chain_entries IS 'Append-only tenant streams serialized with advisory transaction locks.';
COMMENT ON TABLE trust_merkle_batches IS 'Immutable deterministic tenant-bound batches with optional signed-root evidence.';
COMMENT ON TABLE trust_merkle_proofs IS 'Approved Phase 10 durable Merkle inclusion-proof evidence; hash/index/path metadata only, tenant-bound and append-only.';
COMMENT ON TABLE trust_provenance_manifests IS 'Immutable hash/reference-only provenance lifecycle manifests.';
