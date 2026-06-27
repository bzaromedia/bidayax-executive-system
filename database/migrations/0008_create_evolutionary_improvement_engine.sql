create extension if not exists pgcrypto;

create table if not exists improvement_opportunities (
  id uuid primary key default gen_random_uuid(),
  subsystem text not null,
  opportunity_type text not null check (
    opportunity_type in (
      'performance',
      'accessibility',
      'reliability',
      'conversion',
      'safety_gate',
      'documentation',
      'design_system',
      'receptionist_workflow',
      'telephony_readiness',
      'dashboard_usage'
    )
  ),
  evidence_summary text not null,
  source_metric text not null,
  baseline_value numeric not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'detected' check (
    status in ('detected', 'candidate_generated', 'dismissed', 'archived')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists improvement_candidates (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid references improvement_opportunities(id) on delete set null,
  title text not null,
  hypothesis text not null,
  target_subsystem text not null,
  proposed_change_summary text not null,
  expected_metric text not null,
  expected_impact numeric not null,
  risk_score numeric not null check (risk_score >= 0 and risk_score <= 100),
  evidence_score numeric not null check (evidence_score >= 0 and evidence_score <= 100),
  complexity_score numeric not null check (complexity_score >= 0 and complexity_score <= 100),
  priority_score numeric not null check (priority_score >= 0),
  status text not null default 'proposed' check (
    status in (
      'proposed',
      'needs_review',
      'approved',
      'rejected',
      'sandbox_required',
      'archived'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists improvement_lineage_archive (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references improvement_candidates(id) on delete set null,
  parent_candidate_id uuid references improvement_candidates(id) on delete set null,
  variant_id text not null,
  target_area text not null,
  hypothesis text not null,
  design_diff_summary text,
  code_diff_summary text,
  metrics_before jsonb not null default '{}'::jsonb,
  metrics_after jsonb,
  test_results jsonb,
  benchmark_results jsonb,
  review_notes text,
  risk_score numeric not null check (risk_score >= 0 and risk_score <= 100),
  approval_status text not null default 'pending' check (
    approval_status in (
      'pending',
      'approved',
      'rejected',
      'needs_more_evidence',
      'blocked'
    )
  ),
  rollback_plan text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phase13_no_fake_after_metrics check (metrics_after is null),
  constraint phase13_no_fake_test_results check (test_results is null),
  constraint phase13_no_fake_benchmarks check (benchmark_results is null)
);

create table if not exists improvement_approval_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references improvement_candidates(id) on delete cascade,
  decision text not null check (
    decision in ('approved', 'rejected', 'needs_more_evidence', 'blocked')
  ),
  decided_by text not null,
  decision_notes text not null,
  created_at timestamptz not null default now()
);

create index if not exists improvement_opportunities_status_idx
  on improvement_opportunities(status, created_at desc);

create index if not exists improvement_candidates_status_idx
  on improvement_candidates(status, priority_score desc);

create index if not exists improvement_lineage_candidate_idx
  on improvement_lineage_archive(candidate_id, created_at desc);

create index if not exists improvement_approval_candidate_idx
  on improvement_approval_events(candidate_id, created_at desc);
