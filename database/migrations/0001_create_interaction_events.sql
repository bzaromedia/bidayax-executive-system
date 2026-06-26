-- Phase 4: QR Interaction Event Ledger
-- Stores immutable card interaction events without raw IP addresses.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'interaction_event_type'
  ) then
    create type interaction_event_type as enum (
      'qr_scan',
      'card_view',
      'vcard_download',
      'call_click',
      'email_click',
      'website_click'
    );
  end if;
end $$;

create table if not exists interaction_events (
  id uuid primary key default gen_random_uuid(),
  event_type interaction_event_type not null,
  executive_slug text not null check (
    executive_slug in ('ad-garner', 'naimah-barnes', 'sean-hall')
  ),
  session_id text not null check (
    char_length(session_id) between 8 and 128
  ),
  anonymous_visitor_id text not null check (
    char_length(anonymous_visitor_id) between 8 and 128
  ),
  source_url text,
  referrer text,
  user_agent text,
  device_type text not null default 'unknown',
  browser text not null default 'unknown',
  os text not null default 'unknown',
  ip_hash text check (
    ip_hash is null or char_length(ip_hash) = 64
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interaction_events_created_at_idx
  on interaction_events (created_at desc);

create index if not exists interaction_events_executive_created_idx
  on interaction_events (executive_slug, created_at desc);

create index if not exists interaction_events_event_type_created_idx
  on interaction_events (event_type, created_at desc);

create index if not exists interaction_events_session_created_idx
  on interaction_events (session_id, created_at desc);

comment on table interaction_events is
  'Append-only Phase 4 ledger for public executive card interactions.';

comment on column interaction_events.ip_hash is
  'HMAC-SHA256 hash of the request IP; raw IP addresses must not be stored.';

comment on column interaction_events.metadata is
  'Small JSON metadata for action surface and route context. No contact records or personal form data in Phase 4.';
