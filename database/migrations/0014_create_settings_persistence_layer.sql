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

CREATE INDEX IF NOT EXISTS idx_brand_assets_tenant
  ON brand_assets(tenant_id, asset_type);

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

COMMENT ON TABLE tenants IS 'Tenant ownership records for configurable Executive Cards.';
COMMENT ON TABLE tenant_brand_profiles IS 'Tenant brand inputs before token resolution.';
COMMENT ON TABLE executive_card_profiles IS 'Editable executive card profile content.';
COMMENT ON TABLE tenant_receptionist_settings IS 'Phase 3 tenant-scoped Polyglot Receptionist settings.';
COMMENT ON TABLE card_settings_versions IS 'Immutable draft, preview, published, and archived settings snapshots.';
COMMENT ON TABLE settings_audit_events IS 'Event Ledger-ready audit events for settings changes.';
