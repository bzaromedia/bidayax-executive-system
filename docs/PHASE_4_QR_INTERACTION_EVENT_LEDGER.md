# Phase 4 QR Interaction Event Ledger

## Goal

Phase 4 creates the first intelligence layer behind the executive cards: a minimal event ledger that captures meaningful card interactions and stores them as structured PostgreSQL events.

This proves the card can produce durable measurement data without becoming a dashboard, CRM, receptionist, or scoring engine.

## Scope

Phase 4 includes:

- shared interaction event types.
- anonymous browser visitor and session IDs.
- fail-open client event emission.
- `POST /api/events`.
- Zod request validation.
- basic user-agent normalization.
- IP hashing.
- PostgreSQL persistence.
- migration and model documentation.

## Event Flow

```text
QR scan or card route load
-> client event payload
-> POST /api/events
-> validation
-> user-agent normalization
-> IP hash
-> interaction_events insert
-> future dashboard or scoring consumer
```

Phase 4 stops at persistence.

## Event Types

- `qr_scan`: emitted when a card opens with `source=qr`.
- `card_view`: emitted when a card route loads.
- `vcard_download`: emitted when vCard is clicked.
- `call_click`: emitted when Call is clicked.
- `email_click`: emitted when Email is clicked.
- `website_click`: emitted when Website is clicked.

## API

Endpoint:

```text
POST /api/events
```

Example body:

```json
{
  "eventType": "card_view",
  "executiveSlug": "ad-garner",
  "sessionId": "bxs_...",
  "anonymousVisitorId": "bxv_...",
  "sourceUrl": "https://bidayax.com/card/ad-garner",
  "referrer": "https://example.com",
  "metadata": {
    "surface": "executive_card",
    "action": "route_load"
  }
}
```

The server validates the event type, executive slug, anonymous IDs, URLs, and metadata. The client cannot provide `created_at`, `user_agent`, `device_type`, `browser`, `os`, or `ip_hash`; those are generated server-side.

## Database Table

Migration:

```text
database/migrations/0001_create_interaction_events.sql
```

Table:

```text
interaction_events
```

Fields:

- `id`
- `event_type`
- `executive_slug`
- `session_id`
- `anonymous_visitor_id`
- `source_url`
- `referrer`
- `user_agent`
- `device_type`
- `browser`
- `os`
- `ip_hash`
- `metadata`
- `created_at`

## Runtime Configuration

Required:

```text
DATABASE_URL
BIDAYAX_IP_HASH_SECRET
```

Optional:

```text
DATABASE_SSL
PG_POOL_MAX
```

When `DATABASE_URL` is missing, the API returns a generic unavailable response. The card still works because client-side event emission is non-blocking.

## Privacy Behavior

Collected:

- event type.
- executive slug.
- anonymous visitor/session IDs.
- source URL and referrer.
- user-agent string.
- coarse device/browser/OS classification.
- HMAC-SHA256 IP hash.
- small action metadata.

Not collected:

- contact names.
- contact emails.
- contact phone numbers.
- raw IP addresses.
- login identities.
- CRM records.
- lead records.
- message content.

IP hashing uses HMAC-SHA256 with `BIDAYAX_IP_HASH_SECRET`. Production deployments must provide a real secret so hashes are not reversible through simple lookup.

## Fail-Open Client Rule

The card must never wait for event logging. The browser client attempts `sendBeacon` first and falls back to `fetch` with `keepalive`. Any failure is swallowed so call, email, website, and vCard actions continue.

## Observability

The event API logs structured records for:

- `event_received`
- `validation_failure`
- `database_success`
- `database_failure`
- `database_unavailable`

Logs include event type and executive slug, but not raw IPs or full payloads.

## Validation Questions

1. Does every major card action produce an event?
   Yes. Route load, QR-marked route load, vCard, call, email, and website actions emit events.
2. Does event logging fail safely?
   Yes. Client emission is non-blocking and catches failures.
3. Is the event model simple and understandable?
   Yes. One event table, one event type enum, one ingestion endpoint.
4. Is the database schema minimal?
   Yes. It stores only the fields needed for Phase 5 analytics.
5. Is privacy respected?
   Yes. No raw IPs, no contact records, no login identity, no aggressive fingerprinting.
6. Is this enough for Phase 5 dashboard work?
   Yes. Phase 5 can aggregate events by executive, type, source, referrer, device, and time.
7. Did we avoid building analytics prematurely?
   Yes. No charts, dashboard, rollups, or scoring were added.

## Explicit Non-Goals

Phase 4 does not build:

- analytics dashboard.
- charts.
- CRM.
- receptionist functionality.
- intent scoring.
- contact graph.
- authentication.
- admin portal.
- recursive improvement implementation.
- automation workflows.
