# Intent Score Model

## Purpose

`intent_scores` stores deterministic business-intent scores derived from anonymous `interaction_events` groups.

The table turns raw card interactions into ranked executive opportunity signals without creating leads, contacts, CRM records, receptionist workflows, or identity resolution.

## Table

`intent_scores`

## Grouping Rule

One active score exists for each:

```text
anonymous_visitor_id + session_id + executive_slug
```

Scores can be recalculated from `interaction_events` at any time.

## Fields

- `id`: server-generated UUID primary key.
- `anonymous_visitor_id`: anonymous browser visitor ID from Phase 4.
- `session_id`: anonymous browser session ID from Phase 4.
- `executive_slug`: approved executive card slug.
- `score`: deterministic score from 0 to 100.
- `tier`: deterministic intent tier.
- `reason_codes`: explainable scoring reasons.
- `scoring_version`: scoring model version.
- `event_count`: number of source interaction events in the group.
- `first_event_at`: first source event timestamp.
- `last_event_at`: last source event timestamp.
- `created_at`: score row creation timestamp.
- `updated_at`: latest recalculation timestamp.

## Intent Tiers

- Cold Signal
- Warm Signal
- Qualified Signal
- Executive Priority
- Strategic Opportunity

## Privacy Rules

- Raw IP addresses are not stored or used.
- IP hashes are not used for scoring.
- No demographic inference is allowed.
- No contact enrichment is allowed.
- No identity guessing is allowed.
- Scores represent anonymous intent signals, not confirmed leads.

## Recalculation

The Phase 6 recalculation path lives in:

```text
services/intent-scoring
```

It reads `interaction_events`, groups anonymous events, applies scoring version `v1.0.0`, and upserts `intent_scores`.
