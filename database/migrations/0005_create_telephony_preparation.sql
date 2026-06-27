create table if not exists telephony_calls (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_call_id text,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_number text,
  to_number text,
  executive_slug text not null,
  receptionist_interaction_id uuid references receptionist_interactions(id) on delete set null,
  status text not null check (
    status in (
      'simulated',
      'received',
      'queued',
      'ringing',
      'in_progress',
      'completed',
      'failed',
      'cancelled',
      'blocked',
      'requires_approval'
    )
  ),
  language text,
  dialect text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists telephony_call_events (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references telephony_calls(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists voice_sessions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references telephony_calls(id) on delete cascade,
  provider text not null,
  voice_model text not null,
  status text not null check (
    status in ('not_started', 'prepared', 'active', 'completed', 'failed', 'blocked')
  ),
  language text,
  dialect text,
  transcript_status text not null check (
    transcript_status in ('none', 'pending', 'partial', 'completed', 'failed')
  ),
  summary_status text not null check (
    summary_status in ('none', 'pending', 'completed', 'failed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outbound_call_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by text not null,
  to_number text not null,
  executive_slug text not null,
  reason text not null,
  approval_status text not null check (
    approval_status in ('pending', 'approved', 'denied', 'not_required_for_mock')
  ),
  approved_by text,
  approved_at timestamptz,
  status text not null check (
    status in (
      'draft',
      'pending_approval',
      'approved',
      'blocked',
      'ready_for_provider',
      'cancelled',
      'completed'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists telephony_calls_provider_call_idx
  on telephony_calls (provider, provider_call_id);

create index if not exists telephony_calls_executive_idx
  on telephony_calls (executive_slug, created_at desc);

create index if not exists telephony_call_events_call_idx
  on telephony_call_events (call_id, created_at);

create index if not exists voice_sessions_call_idx
  on voice_sessions (call_id);

create index if not exists outbound_call_requests_status_idx
  on outbound_call_requests (approval_status, status, created_at desc);
