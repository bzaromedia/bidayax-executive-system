create table if not exists provider_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mock', 'twilio', 'openai_realtime')),
  check_name text not null,
  status text not null check (status in ('passed', 'failed', 'warning', 'skipped')),
  details text not null,
  checked_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists voice_runtime_sessions (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references telephony_calls(id) on delete set null,
  provider text not null check (provider in ('none', 'openai_realtime')),
  runtime_model text,
  status text not null check (
    status in (
      'not_configured',
      'configured',
      'prepared',
      'active_test',
      'completed_test',
      'blocked',
      'failed'
    )
  ),
  test_mode boolean not null default true,
  safety_gate_status text not null check (
    safety_gate_status in (
      'blocked_by_default',
      'missing_configuration',
      'test_mode_only',
      'approved_for_test',
      'approved_for_production'
    )
  ),
  transcript_status text not null check (
    transcript_status in ('none', 'pending', 'partial', 'completed', 'failed')
  ),
  summary_status text not null check (
    summary_status in ('none', 'pending', 'completed', 'failed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists provider_readiness_checks_provider_idx
  on provider_readiness_checks (provider, checked_at desc);

create index if not exists voice_runtime_sessions_status_idx
  on voice_runtime_sessions (status, created_at desc);

create index if not exists voice_runtime_sessions_call_idx
  on voice_runtime_sessions (call_id);

