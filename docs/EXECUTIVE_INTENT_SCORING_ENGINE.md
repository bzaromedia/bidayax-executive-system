# Executive Intent Scoring Engine

## Purpose

The Executive Intent Scoring Engine ranks anonymous executive-card interaction groups by transparent business intent.

It converts `interaction_events` into `intent_scores` so the dashboard can show priority signals without inventing contacts, leads, or customer identities.

## Version

```text
v1.0.0
```

## Inputs

The engine reads only `interaction_events`.

Allowed inputs:

- event type.
- anonymous visitor ID.
- session ID.
- executive slug.
- source URL.
- referrer.
- coarse device type.
- coarse browser.
- coarse operating system.
- event timestamps.

Disallowed inputs:

- raw IP addresses.
- IP hashes.
- demographic traits.
- inferred identity.
- external enrichment.
- contact records.
- CRM data.
- receptionist notes.

## Grouping

Events are grouped by:

```text
anonymous_visitor_id + session_id + executive_slug
```

Each group receives one active score.

## Score Factors

### Event Type Value

- `qr_scan`: 4
- `card_view`: 5
- `website_click`: 15
- `vcard_download`: 25
- `email_click`: 35
- `call_click`: 45

### Repeat Engagement

Multiple events in the same anonymous group add a capped repeat-engagement bonus.

### Action Depth

Deeper actions add a bonus:

```text
card_view < website_click < vcard_download < email_click < call_click
```

### Recency

Recent activity receives a simple bonus relative to the scoring timestamp.

### Session Density

Multiple action types in a compact session add a multi-action session bonus.

### Source Confidence

Known source or referrer context adds a small confidence bonus.

### Device Context

Complete coarse device/browser/OS metadata adds a very small context bonus.

## Tiers

- 0 to 24: Cold Signal
- 25 to 49: Warm Signal
- 50 to 69: Qualified Signal
- 70 to 84: Executive Priority
- 85 to 100: Strategic Opportunity

## Reason Codes

Reason codes explain why a score exists:

- `NO_EVENTS`
- `QR_SCANNED`
- `CARD_VIEWED`
- `WEBSITE_VISITED`
- `VCARD_DOWNLOADED`
- `EMAIL_CLICKED`
- `CALL_CLICKED`
- `REPEAT_ENGAGEMENT`
- `HIGH_ACTION_DEPTH`
- `RECENT_ACTIVITY`
- `MULTI_ACTION_SESSION`
- `KNOWN_REFERRER`
- `DEVICE_CONTEXT_PRESENT`

## Recalculation

The recalculation pathway lives in:

```text
services/intent-scoring
```

It reads `interaction_events`, applies scoring version `v1.0.0`, and upserts `intent_scores`.

## Dashboard Use

The dashboard shows:

- top anonymous intent signals.
- intent tier breakdown.
- reason codes.
- executive-level intent summaries.

It must describe results as signals, not confirmed leads.
