create table if not exists telemetry_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  subsystem text not null check (
    subsystem in (
      'card',
      'dashboard',
      'event_ledger',
      'intent_scoring',
      'contact_graph',
      'receptionist',
      'telephony',
      'provider_readiness',
      'system',
      'database',
      'security'
    )
  ),
  severity text not null check (
    severity in ('debug', 'info', 'warning', 'error', 'critical')
  ),
  status text not null check (
    status in ('success', 'failure', 'blocked', 'degraded', 'skipped')
  ),
  correlation_id text,
  session_id text,
  anonymous_visitor_id text,
  executive_slug text,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists telemetry_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  subsystem text not null,
  metric_value numeric not null,
  metric_unit text not null,
  dimensions jsonb not null default '{}'::jsonb,
  measured_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists telemetry_error_events (
  id uuid primary key default gen_random_uuid(),
  subsystem text not null,
  error_code text not null,
  error_category text not null,
  severity text not null check (
    severity in ('debug', 'info', 'warning', 'error', 'critical')
  ),
  safe_message text not null,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists telemetry_safety_gate_events (
  id uuid primary key default gen_random_uuid(),
  gate_name text not null,
  subsystem text not null,
  decision text not null check (
    decision in ('allowed', 'blocked', 'warning', 'skipped')
  ),
  reason_codes jsonb not null default '[]'::jsonb,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists telemetry_events_subsystem_created_idx
  on telemetry_events (subsystem, created_at desc);

create index if not exists telemetry_events_name_created_idx
  on telemetry_events (event_name, created_at desc);

create index if not exists telemetry_metrics_name_measured_idx
  on telemetry_metrics (metric_name, measured_at desc);

create index if not exists telemetry_error_events_subsystem_created_idx
  on telemetry_error_events (subsystem, created_at desc);

create index if not exists telemetry_safety_gate_events_gate_created_idx
  on telemetry_safety_gate_events (gate_name, created_at desc);

