# Receptionist Settings Model

Receptionist settings define how the Polyglot Receptionist consumes tenant,
executive, language, routing, consent, and escalation preferences. These
settings configure workflow behavior; they do not claim live telephony,
calendar, or email provider dispatch unless provider credentials are configured
and tested.

## Tables

### receptionist_settings

Per-tenant receptionist configuration used by published card snapshots.

Columns:
- `receptionist_settings_id uuid primary key`
- `tenant_id uuid not null references tenants(tenant_id)`
- `enabled boolean not null default false`
- `default_language text not null`
- `supported_languages jsonb not null default '[]'::jsonb`
- `voice_profile text not null`
- `mood text not null`
- `greeting_mode text not null`
- `standard_greeting text not null`
- `custom_greeting text`
- `fallback_behavior text not null`
- `call_routing_rules jsonb not null default '[]'::jsonb`
- `appointment_rules jsonb not null default '{}'::jsonb`
- `after_hours_behavior text not null`
- `escalation_contacts jsonb not null default '[]'::jsonb`
- `consent_disclosure text not null`
- `recording_policy text not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:
- `receptionist_settings_tenant_id_idx` on `tenant_id`
- `receptionist_settings_enabled_idx` on `enabled`
- `receptionist_settings_default_language_idx` on `default_language`

Constraints:
- `supported_languages` must include `default_language`.
- `voice_profile` must map to an approved receptionist voice profile.
- `mood` must map to an approved receptionist mood.
- `greeting_mode` must be `standard` or `custom`.
- `custom_greeting` is required only when `greeting_mode = 'custom'`.
- `recording_policy` must be compatible with `consent_disclosure`.
- Routing rules must use allowlisted request types and safe actions.

## Workflow Consumption

Published card settings expose receptionist settings to:
- card request forms;
- chat and voice-chat entry points;
- inbound call workflow adapters;
- callback scheduling queues;
- dashboard visibility;
- settings audit and Event Ledger events.

## Provider Boundary

Active in Phase 2A:
- configuration model;
- validation rules;
- publish safety contract;
- queued workflow mode documentation.

Deferred until provider configuration:
- live telephony dispatch;
- live email delivery;
- live calendar booking;
- autonomous call transfer.

If providers are unconfigured, receptionist workflows must use queued internal
requests and dashboard-visible records.

## Relationships

- One tenant has one active receptionist settings record at publish time.
- One card settings version embeds the receptionist settings snapshot that was
  validated for preview or publish.
- Settings changes create `settings.updated` audit events.
- Published changes create `settings.published` Event Ledger hooks.

## Safety Rules

Receptionist settings cannot enable:
- unsupported claims of autonomous calling;
- legal, medical, or financial commitments;
- payment acceptance;
- contract approval;
- private executive data disclosure;
- bypassing human approval for sensitive actions.
