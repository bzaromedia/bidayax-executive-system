# Phase 5 Executive Interaction Dashboard

## Goal

Phase 5 turns stored QR/card ledger events into the first internal BidayaX intelligence surface.

It proves that `interaction_events` can be read and summarized without creating a CRM, receptionist workflow, contact graph, or intent scoring system.

## Scope

Phase 5 includes:

- `apps/dashboard`.
- server-side PostgreSQL reads from `interaction_events`.
- metric cards.
- activity by executive.
- activity by event type.
- recent anonymous interaction feed.
- 14-day activity trend.
- simple conversion summaries.
- empty and unavailable states.

## Data Source

The dashboard reads only:

```text
interaction_events
```

No new database tables are created in Phase 5.

## Metrics

Implemented metrics:

- total interactions.
- card views.
- vCard downloads.
- call clicks.
- email clicks.
- website clicks.
- most active executive by interaction count.
- highest intent action by simple action count.

## Conversion Summaries

The dashboard calculates:

- `vcard_download / card_view`
- `call_click / card_view`
- `email_click / card_view`
- `website_click / card_view`

If `card_view` is zero, the dashboard shows `Not enough data`.

## Recent Interaction Feed

The feed shows:

- event type.
- executive.
- coarse device type.
- coarse browser.
- coarse operating system.
- source or referrer host when available.
- event time.

The feed does not show raw IPs, contact records, user accounts, names, emails, phone numbers, or private notes.

## Data Honesty

The dashboard does not invent metrics. If `DATABASE_URL` is missing, the database query fails, or there are no rows, the dashboard shows a clear empty state and zero values.

No growth, trend, or insight claim is shown unless it can be calculated from real ledger rows.

## Observability

The dashboard logs structured records for:

- `dashboard_query_success`
- `dashboard_query_failure`
- `empty_data_state`
- `invalid_event_data`

Logs do not include raw IPs or full event payloads.

## Validation Questions

1. Does the dashboard read real `interaction_events` data?
   Yes. All metrics come from PostgreSQL reads against `interaction_events`.
2. Does it avoid fake analytics?
   Yes. Missing or empty data produces empty states and zero values.
3. Does it clearly show executive card performance?
   Yes. It shows executive breakdown, event-type breakdown, recent events, and conversion ratios.
4. Does it preserve privacy?
   Yes. It shows anonymous aggregate and event metadata only.
5. Does it use the design system?
   Yes. It uses token-backed layout and `packages/ui` primitives.
6. Does it stay minimal and understandable?
   Yes. It uses one app, one query layer, and no heavy chart dependency.
7. Is this enough to support Phase 6?
   Yes. Phase 6 can consume ledger data after the first dashboard proves the read model.

## Explicit Non-Goals

Phase 5 does not build:

- receptionist functionality.
- CRM functionality.
- lead scoring.
- intent scoring.
- scheduling.
- user accounts.
- complex admin permissions.
- contact graph.
- full business intelligence platform.
- recursive improvement implementation.
