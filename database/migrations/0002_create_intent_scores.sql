-- Phase 6: Executive Intent Scoring Engine
-- Stores deterministic, explainable scores derived from interaction_events.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'intent_tier'
  ) then
    create type intent_tier as enum (
      'Cold Signal',
      'Warm Signal',
      'Qualified Signal',
      'Executive Priority',
      'Strategic Opportunity'
    );
  end if;
end $$;

create table if not exists intent_scores (
  id uuid primary key default gen_random_uuid(),
  anonymous_visitor_id text not null check (
    char_length(anonymous_visitor_id) between 8 and 128
  ),
  session_id text not null check (
    char_length(session_id) between 8 and 128
  ),
  executive_slug text not null check (
    executive_slug in ('ad-garner', 'naimah-barnes', 'sean-hall')
  ),
  score integer not null check (
    score between 0 and 100
  ),
  tier intent_tier not null,
  reason_codes text[] not null check (
    cardinality(reason_codes) > 0
  ),
  scoring_version text not null,
  event_count integer not null check (
    event_count >= 0
  ),
  first_event_at timestamptz,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (anonymous_visitor_id, session_id, executive_slug)
);

create index if not exists intent_scores_score_idx
  on intent_scores (score desc, last_event_at desc);

create index if not exists intent_scores_tier_idx
  on intent_scores (tier);

create index if not exists intent_scores_executive_idx
  on intent_scores (executive_slug, score desc);

comment on table intent_scores is
  'Deterministic Phase 6 intent scores derived from anonymous interaction_events groups.';

comment on column intent_scores.reason_codes is
  'Explainable reason codes for score transparency. No personal identity or enrichment data.';

comment on column intent_scores.scoring_version is
  'Scoring model version used to produce the row. Phase 6 starts with v1.0.0.';
