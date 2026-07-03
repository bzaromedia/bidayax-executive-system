CREATE TABLE IF NOT EXISTS brand_theme_configs (
  theme_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  background_color TEXT NOT NULL,
  surface_color TEXT NOT NULL,
  text_color TEXT NOT NULL,
  muted_text_color TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  logo_mark_url TEXT NOT NULL,
  font_display TEXT NOT NULL,
  font_body TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_customization_profiles (
  profile_id TEXT PRIMARY KEY,
  executive_slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  bio TEXT NOT NULL,
  tagline TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT NOT NULL,
  avatar_url TEXT,
  theme_id TEXT NOT NULL REFERENCES brand_theme_configs(theme_id),
  receptionist_settings_id TEXT NOT NULL,
  calendar_settings_id TEXT NOT NULL,
  qr_feedback_settings_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS executive_avatar_assets (
  avatar_id TEXT PRIMARY KEY,
  executive_slug TEXT NOT NULL REFERENCES card_customization_profiles(executive_slug) ON DELETE CASCADE,
  avatar_url TEXT,
  alt_text TEXT NOT NULL,
  initials TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('valid', 'missing', 'invalid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_action_configs (
  action_config_id TEXT PRIMARY KEY,
  executive_slug TEXT NOT NULL REFERENCES card_customization_profiles(executive_slug) ON DELETE CASCADE,
  call_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  connect_enabled BOOLEAN NOT NULL DEFAULT true,
  website_enabled BOOLEAN NOT NULL DEFAULT true,
  download_enabled BOOLEAN NOT NULL DEFAULT true,
  share_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_booking_configs (
  calendar_settings_id TEXT PRIMARY KEY,
  executive_slug TEXT NOT NULL REFERENCES card_customization_profiles(executive_slug) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  meeting_behavior TEXT NOT NULL CHECK (meeting_behavior IN ('internal_request', 'external_calendar', 'disabled')),
  external_calendar_url TEXT,
  available_slot_labels JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receptionist_settings (
  receptionist_id TEXT PRIMARY KEY,
  executive_slug TEXT NOT NULL REFERENCES card_customization_profiles(executive_slug) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  voice_style TEXT NOT NULL,
  mood TEXT NOT NULL,
  greeting_mode TEXT NOT NULL CHECK (greeting_mode IN ('standard', 'custom')),
  standard_greeting TEXT NOT NULL,
  custom_greeting TEXT,
  supported_languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_language TEXT NOT NULL,
  request_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_tone TEXT NOT NULL,
  handoff_email TEXT NOT NULL,
  meeting_behavior TEXT NOT NULL CHECK (meeting_behavior IN ('internal_request', 'external_calendar', 'disabled')),
  consent_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qr_feedback_settings (
  qr_feedback_settings_id TEXT PRIMARY KEY,
  executive_slug TEXT NOT NULL REFERENCES card_customization_profiles(executive_slug) ON DELETE CASCADE,
  haptics_enabled BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT false,
  animation_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customization_audit_events (
  audit_event_id TEXT PRIMARY KEY,
  setting_type TEXT NOT NULL,
  old_value_hash TEXT NOT NULL,
  new_value_hash TEXT NOT NULL,
  actor TEXT NOT NULL,
  affected_card TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_customization_profiles_slug
  ON card_customization_profiles(executive_slug);

CREATE INDEX IF NOT EXISTS idx_receptionist_settings_executive_slug
  ON receptionist_settings(executive_slug);

CREATE INDEX IF NOT EXISTS idx_customization_audit_events_affected_card
  ON customization_audit_events(affected_card, created_at DESC);

COMMENT ON TABLE card_customization_profiles IS 'Configuration-driven executive card profile settings.';
COMMENT ON TABLE brand_theme_configs IS 'Approved customer brand theme aliases for card rendering.';
COMMENT ON TABLE customization_audit_events IS 'Auditable hashes for card settings changes.';
