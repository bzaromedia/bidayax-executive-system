create table if not exists contact_graph_nodes (
  id uuid primary key default gen_random_uuid(),
  node_type text not null check (
    node_type in (
      'visitor',
      'session',
      'executive',
      'interaction_event',
      'intent_score'
    )
  ),
  stable_key text not null unique,
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contact_graph_edges (
  id uuid primary key default gen_random_uuid(),
  edge_type text not null check (
    edge_type in (
      'visitor_has_session',
      'session_viewed_executive',
      'session_generated_event',
      'event_targets_executive',
      'session_has_intent_score',
      'visitor_engaged_executive'
    )
  ),
  source_node_id uuid not null references contact_graph_nodes(id) on delete cascade,
  target_node_id uuid not null references contact_graph_nodes(id) on delete cascade,
  weight integer not null default 1 check (weight > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edge_type, source_node_id, target_node_id)
);

create table if not exists contact_graph_snapshots (
  id uuid primary key default gen_random_uuid(),
  executive_slug text not null,
  anonymous_visitor_id text not null,
  session_id text not null,
  total_events integer not null default 0 check (total_events >= 0),
  highest_intent_score integer,
  highest_intent_tier text,
  engagement_summary text not null,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (executive_slug, anonymous_visitor_id, session_id)
);

create index if not exists contact_graph_nodes_type_idx
  on contact_graph_nodes (node_type);

create index if not exists contact_graph_edges_source_idx
  on contact_graph_edges (source_node_id);

create index if not exists contact_graph_edges_target_idx
  on contact_graph_edges (target_node_id);

create index if not exists contact_graph_snapshots_executive_idx
  on contact_graph_snapshots (executive_slug, last_activity_at desc);

create index if not exists contact_graph_snapshots_visitor_idx
  on contact_graph_snapshots (anonymous_visitor_id, session_id);
