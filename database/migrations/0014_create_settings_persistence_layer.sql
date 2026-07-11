CREATE TABLE IF NOT EXISTS tenants (
  tenant_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS brand_assets (
  asset_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (
    asset_type IN ('logo', 'favicon', 'profile_image', 'card_media')
  ),
  storage_path TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant_brand_profiles (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_asset_id TEXT NOT NULL,
  favicon_asset_id TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  background_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  font_family TEXT NOT NULL,
  button_radius TEXT NOT NULL,
  card_radius TEXT NOT NULL,
  motion_intensity TEXT NOT NULL CHECK (
    motion_intensity IN ('none', 'reduced', 'standard', 'expressive')
  ),
  contrast_mode TEXT NOT NULL CHECK (
    contrast_mode IN ('standard', 'high_contrast', 'soft_luxury')
  ),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS executive_card_profiles (
  card_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  executive_name TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  bio TEXT NOT NULL,
  profile_image_asset_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT NOT NULL,
  calendar_url TEXT NOT NULL,
  location TEXT NOT NULL,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_cta JSONB NOT NULL,
  secondary_cta JSONB NOT NULL,
  qr_destination_mode TEXT NOT NULL CHECK (
    qr_destination_mode IN ('card_profile', 'direct_contact', 'calendar', 'custom_url')
  ),
  published_version TEXT,
  draft_version TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'preview', 'published', 'archived')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_receptionist_settings (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  default_language TEXT NOT NULL,
  supported_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  voice_profile TEXT NOT NULL CHECK (
    voice_profile IN ('executive', 'warm', 'energetic', 'calm', 'professional', 'luxury')
  ),
  mood TEXT NOT NULL CHECK (
    mood IN ('confident', 'friendly', 'concise', 'formal', 'high_energy', 'calm')
  ),
  greeting_mode TEXT NOT NULL CHECK (greeting_mode IN ('standard', 'custom')),
  standard_greeting TEXT NOT NULL,
  custom_greeting TEXT,
  fallback_behavior TEXT NOT NULL CHECK (
    fallback_behavior IN ('queue_callback', 'take_message', 'route_to_email', 'human_review')
  ),
  call_routing_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  appointment_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_hours_behavior TEXT NOT NULL CHECK (
    after_hours_behavior IN (
      'queue_next_business_day',
      'take_message',
      'urgent_escalation_only',
      'disabled'
    )
  ),
  escalation_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  consent_disclosure TEXT NOT NULL,
  recording_policy TEXT NOT NULL CHECK (
    recording_policy IN ('disabled', 'disclose_and_record', 'transcript_only')
  ),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_settings_versions (
  version_id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL REFERENCES executive_card_profiles(card_id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  settings_snapshot JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'preview', 'published', 'archived')),
  snapshot_hash TEXT NOT NULL,
  immutable BOOLEAN NOT NULL,
  previous_version_id TEXT REFERENCES card_settings_versions(version_id)
);

CREATE TABLE IF NOT EXISTS settings_audit_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES executive_card_profiles(card_id) ON DELETE CASCADE,
  actor JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  snapshot_hash TEXT,
  previous_snapshot_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical'))
);


CREATE TABLE IF NOT EXISTS settings_idempotency_keys (
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES executive_card_profiles(card_id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  result_version_id TEXT REFERENCES card_settings_versions(version_id),
  result_snapshot_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (tenant_id, card_id, operation, idempotency_key)
);

CREATE OR REPLACE FUNCTION enforce_settings_card_tenant_match()
RETURNS TRIGGER AS $$
DECLARE
  owning_tenant_id TEXT;
BEGIN
  SELECT tenant_id
    INTO owning_tenant_id
    FROM executive_card_profiles
   WHERE card_id = NEW.card_id;

  IF owning_tenant_id IS NULL THEN
    RAISE EXCEPTION 'settings card tenant ownership check failed: card % does not exist', NEW.card_id;
  END IF;

  IF NEW.tenant_id <> owning_tenant_id THEN
    RAISE EXCEPTION 'settings tenant_id must match card owner tenant_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_card_settings_versions_tenant_match
  ON card_settings_versions;

CREATE TRIGGER trg_card_settings_versions_tenant_match
  BEFORE INSERT OR UPDATE ON card_settings_versions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_settings_card_tenant_match();

DROP TRIGGER IF EXISTS trg_settings_audit_events_tenant_match
  ON settings_audit_events;

CREATE TRIGGER trg_settings_audit_events_tenant_match
  BEFORE INSERT OR UPDATE ON settings_audit_events
  FOR EACH ROW
  EXECUTE FUNCTION enforce_settings_card_tenant_match();

DROP TRIGGER IF EXISTS trg_settings_idempotency_keys_tenant_match
  ON settings_idempotency_keys;

CREATE TRIGGER trg_settings_idempotency_keys_tenant_match
  BEFORE INSERT OR UPDATE ON settings_idempotency_keys
  FOR EACH ROW
  EXECUTE FUNCTION enforce_settings_card_tenant_match();
CREATE OR REPLACE FUNCTION prevent_published_settings_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' AND NEW.status = 'published' THEN
    RAISE EXCEPTION 'published settings versions are immutable';
  END IF;

  IF OLD.status = 'published' AND NEW.status = 'archived' THEN
    IF NEW.version_id <> OLD.version_id
      OR NEW.card_id <> OLD.card_id
      OR NEW.tenant_id <> OLD.tenant_id
      OR NEW.settings_snapshot <> OLD.settings_snapshot
      OR NEW.created_by <> OLD.created_by
      OR NEW.created_at <> OLD.created_at
      OR NEW.snapshot_hash <> OLD.snapshot_hash
      OR NEW.previous_version_id IS DISTINCT FROM OLD.previous_version_id THEN
      RAISE EXCEPTION 'archiving may only update lifecycle metadata';
    END IF;

    NEW.immutable := TRUE;
    RETURN NEW;
  END IF;

  IF OLD.immutable = TRUE THEN
    RAISE EXCEPTION 'immutable settings versions cannot be updated';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_published_settings_version_mutation
  ON card_settings_versions;

CREATE TRIGGER trg_prevent_published_settings_version_mutation
  BEFORE UPDATE ON card_settings_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_published_settings_version_mutation();

CREATE OR REPLACE FUNCTION prevent_settings_audit_event_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'settings audit events are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_settings_audit_event_update
  ON settings_audit_events;

CREATE TRIGGER trg_prevent_settings_audit_event_update
  BEFORE UPDATE ON settings_audit_events
  FOR EACH ROW
  EXECUTE FUNCTION prevent_settings_audit_event_update();

CREATE INDEX IF NOT EXISTS idx_brand_assets_tenant
  ON brand_assets(tenant_id, asset_type);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_assets_tenant_asset
  ON brand_assets(tenant_id, asset_id);

CREATE INDEX IF NOT EXISTS idx_executive_card_profiles_tenant
  ON executive_card_profiles(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_tenant_receptionist_settings_tenant
  ON tenant_receptionist_settings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_card_settings_versions_card_status
  ON card_settings_versions(card_id, tenant_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_card_settings_versions_current_published
  ON card_settings_versions(card_id, tenant_id)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_settings_audit_events_card_time
  ON settings_audit_events(card_id, tenant_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_settings_audit_events_tenant_event
  ON settings_audit_events(tenant_id, card_id, event_id);

CREATE INDEX IF NOT EXISTS idx_settings_idempotency_lookup
  ON settings_idempotency_keys(tenant_id, card_id, operation, created_at DESC);

COMMENT ON TABLE tenants IS 'Tenant ownership records for configurable Executive Cards.';
COMMENT ON TABLE tenant_brand_profiles IS 'Tenant brand inputs before token resolution.';
COMMENT ON TABLE executive_card_profiles IS 'Editable executive card profile content.';
COMMENT ON TABLE tenant_receptionist_settings IS 'Phase 3 tenant-scoped Polyglot Receptionist settings.';
COMMENT ON TABLE card_settings_versions IS 'Immutable draft, preview, published, and archived settings snapshots.';
COMMENT ON TABLE settings_audit_events IS 'Event Ledger-ready append-only audit events for settings changes.';
COMMENT ON TABLE settings_idempotency_keys IS 'Tenant-scoped idempotency records for settings write operations.';
