create table if not exists receptionist_interactions (
  id uuid primary key default gen_random_uuid(),
  interaction_type text not null check (
    interaction_type in (
      'inbound_call',
      'outbound_call',
      'email',
      'scheduling_request',
      'website_inquiry',
      'follow_up',
      'internal_note'
    )
  ),
  channel text not null check (
    channel in ('phone', 'email', 'web', 'sms', 'internal')
  ),
  status text not null check (
    status in (
      'simulated',
      'received',
      'classified',
      'pending_review',
      'escalated',
      'resolved',
      'archived'
    )
  ),
  language text not null,
  dialect text,
  caller_or_sender text,
  executive_slug text not null,
  anonymous_visitor_id text,
  session_id text,
  summary text not null,
  sentiment text not null,
  priority text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists receptionist_tasks (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references receptionist_interactions(id) on delete cascade,
  task_type text not null check (
    task_type in (
      'return_call',
      'send_email',
      'schedule_meeting',
      'qualify_lead',
      'escalate_to_executive',
      'update_contact_graph',
      'create_follow_up',
      'review_transcript'
    )
  ),
  status text not null check (
    status in (
      'simulated',
      'pending',
      'in_review',
      'approved',
      'completed',
      'cancelled'
    )
  ),
  assigned_to text,
  due_at timestamptz,
  priority text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists receptionist_conversation_turns (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references receptionist_interactions(id) on delete cascade,
  speaker text not null check (
    speaker in ('visitor', 'receptionist', 'system', 'executive')
  ),
  language text not null,
  text text not null,
  sequence_number integer not null check (sequence_number > 0),
  created_at timestamptz not null default now(),
  unique (interaction_id, sequence_number)
);

create table if not exists receptionist_workflow_events (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references receptionist_interactions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists receptionist_interactions_executive_idx
  on receptionist_interactions (executive_slug, created_at desc);

create index if not exists receptionist_interactions_status_idx
  on receptionist_interactions (status, created_at desc);

create index if not exists receptionist_tasks_interaction_idx
  on receptionist_tasks (interaction_id);

create index if not exists receptionist_tasks_status_idx
  on receptionist_tasks (status, priority);

create index if not exists receptionist_workflow_events_interaction_idx
  on receptionist_workflow_events (interaction_id, created_at);
