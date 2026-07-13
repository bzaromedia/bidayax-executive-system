CREATE TABLE IF NOT EXISTS telephony_phone_numbers (
  phone_number_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  e164_number TEXT NOT NULL,
  extension TEXT,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'active', 'suspended', 'released')),
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  country TEXT NOT NULL,
  timezone TEXT NOT NULL,
  provider_reference JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, e164_number),
  UNIQUE (phone_number_id, tenant_id),
  CHECK (e164_number ~ '^\+[1-9][0-9]{7,14}$')
);

CREATE TABLE IF NOT EXISTS telephony_call_sessions (
  session_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  caller JSONB NOT NULL,
  callee JSONB NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  state TEXT NOT NULL CHECK (
    state IN (
      'requested', 'queued', 'dialing', 'ringing', 'answered', 'in_conversation',
      'transferred', 'held', 'resumed', 'completed', 'failed', 'busy', 'no_answer',
      'voicemail', 'cancelled'
    )
  ),
  start_time TIMESTAMPTZ,
  answer_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  outcome TEXT,
  recording_reference TEXT,
  transcript_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (phone_number_id, tenant_id)
    REFERENCES telephony_phone_numbers(phone_number_id, tenant_id)
    ON DELETE RESTRICT,
  CHECK (answer_time IS NULL OR start_time IS NULL OR answer_time >= start_time),
  CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

CREATE TABLE IF NOT EXISTS telephony_call_queues (
  queue_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'archived')),
  max_depth INTEGER NOT NULL CHECK (max_depth > 0),
  priority INTEGER NOT NULL CHECK (priority >= 0),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telephony_callback_requests (
  callback_request_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  session_id TEXT,
  requester JSONB NOT NULL,
  requested_time TIMESTAMPTZ,
  priority_score INTEGER NOT NULL CHECK (priority_score BETWEEN 0 AND 100),
  state TEXT NOT NULL CHECK (
    state IN ('requested', 'scheduled', 'assigned', 'attempting', 'completed', 'failed', 'cancelled')
  ),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (session_id)
    REFERENCES telephony_call_sessions(session_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS telephony_appointment_requests (
  appointment_request_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  session_id TEXT,
  requester JSONB NOT NULL,
  requested_time TIMESTAMPTZ,
  timezone TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('requested', 'pending', 'confirmed', 'cancelled', 'completed')),
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE,
  FOREIGN KEY (session_id)
    REFERENCES telephony_call_sessions(session_id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS telephony_call_transcripts (
  transcript_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES telephony_call_sessions(session_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('none', 'pending', 'partial', 'completed', 'failed')),
  language TEXT,
  storage_reference TEXT,
  retention_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telephony_voice_profiles (
  voice_profile_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  accent TEXT,
  tone TEXT NOT NULL CHECK (tone IN ('executive', 'warm', 'calm', 'professional', 'urgent')),
  speed TEXT NOT NULL CHECK (speed IN ('slow', 'standard', 'fast')),
  gender TEXT NOT NULL CHECK (gender IN ('neutral', 'feminine', 'masculine', 'unspecified')),
  provider_mapping JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, language, accent, tone)
);

CREATE TABLE IF NOT EXISTS telephony_call_recordings (
  recording_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES telephony_call_sessions(session_id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('disabled', 'pending', 'stored', 'archived', 'deleted')),
  storage_reference TEXT,
  consent_captured BOOLEAN NOT NULL DEFAULT FALSE,
  retention_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telephony_voicemails (
  voicemail_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  session_id TEXT REFERENCES telephony_call_sessions(session_id) ON DELETE SET NULL,
  state TEXT NOT NULL CHECK (state IN ('received', 'stored', 'processed', 'archived')),
  caller JSONB NOT NULL,
  recording_reference TEXT,
  transcript_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telephony_routing_rules (
  rule_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  rule_type TEXT NOT NULL CHECK (
    rule_type IN (
      'business_hours', 'after_hours', 'holiday', 'executive_unavailable', 'language',
      'overflow', 'emergency', 'callback_required', 'priority', 'escalation'
    )
  ),
  priority INTEGER NOT NULL CHECK (priority >= 0),
  condition JSONB NOT NULL DEFAULT '{}'::jsonb,
  action TEXT NOT NULL CHECK (action IN ('route_to_queue', 'queue_callback', 'take_message', 'escalate', 'block')),
  destination TEXT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telephony_escalation_policies (
  policy_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  name TEXT NOT NULL,
  hierarchy JSONB NOT NULL DEFAULT '[]'::jsonb,
  emergency_behavior TEXT NOT NULL CHECK (emergency_behavior IN ('block', 'escalate_human', 'take_message')),
  require_human_approval BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telephony_usage_ledger (
  ledger_entry_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  session_id TEXT REFERENCES telephony_call_sessions(session_id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (
    category IN (
      'provider_minutes', 'future_ai_runtime', 'future_transcription', 'future_tts',
      'future_stt', 'recording_storage', 'callback_attempt', 'appointment_request'
    )
  ),
  quantity NUMERIC NOT NULL CHECK (quantity >= 0),
  unit TEXT NOT NULL CHECK (unit IN ('second', 'minute', 'request', 'byte', 'usd')),
  estimated_cost_cents INTEGER NOT NULL CHECK (estimated_cost_cents >= 0),
  occurred_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS telephony_audit_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT,
  session_id TEXT REFERENCES telephony_call_sessions(session_id) ON DELETE SET NULL,
  actor JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (card_id, tenant_id)
    REFERENCES executive_card_profiles(card_id, tenant_id)
    ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION prevent_telephony_append_only_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'telephony evidence tables are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_telephony_audit_update ON telephony_audit_events;
CREATE TRIGGER trg_prevent_telephony_audit_update
  BEFORE UPDATE OR DELETE ON telephony_audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_telephony_append_only_update();

DROP TRIGGER IF EXISTS trg_prevent_telephony_usage_update ON telephony_usage_ledger;
CREATE TRIGGER trg_prevent_telephony_usage_update
  BEFORE UPDATE OR DELETE ON telephony_usage_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_telephony_append_only_update();

CREATE INDEX IF NOT EXISTS idx_telephony_phone_numbers_tenant_status
  ON telephony_phone_numbers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_telephony_call_sessions_tenant_card_state
  ON telephony_call_sessions(tenant_id, card_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telephony_callbacks_tenant_card_state
  ON telephony_callback_requests(tenant_id, card_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telephony_appointments_tenant_card_state
  ON telephony_appointment_requests(tenant_id, card_id, state, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telephony_routing_rules_tenant_priority
  ON telephony_routing_rules(tenant_id, card_id, enabled, priority);
CREATE INDEX IF NOT EXISTS idx_telephony_usage_tenant_time
  ON telephony_usage_ledger(tenant_id, occurred_at DESC, category);
CREATE INDEX IF NOT EXISTS idx_telephony_audit_tenant_time
  ON telephony_audit_events(tenant_id, card_id, occurred_at DESC, event_id);

COMMENT ON TABLE telephony_phone_numbers IS 'Provider-independent tenant phone-number ownership model; provider references are metadata only.';
COMMENT ON TABLE telephony_call_sessions IS 'Provider-independent call sessions controlled by the BidayaX Telephony Control Plane.';
COMMENT ON TABLE telephony_usage_ledger IS 'Append-only telephony usage and future cost ledger.';
COMMENT ON TABLE telephony_audit_events IS 'Append-only telephony control-plane audit evidence.';
