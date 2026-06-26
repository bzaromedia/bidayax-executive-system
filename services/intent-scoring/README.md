# BidayaX Intent Scoring Service

Phase 6 creates a deterministic Executive Intent Scoring Engine.

## Purpose

The service groups `interaction_events` by anonymous visitor, session, and executive, then calculates a transparent intent score.

It does not use machine learning, contact enrichment, CRM records, receptionist automation, or identity guessing.

## Scoring Version

`v1.0.0`

## Run Tests

```bash
pnpm --filter @bidayax/intent-scoring test
```

## Typecheck

```bash
pnpm --filter @bidayax/intent-scoring typecheck
```

## Manual Recalculation

```bash
DATABASE_URL=postgres://... pnpm --filter @bidayax/intent-scoring recalculate
```

The recalculation path reads from `interaction_events` and upserts into `intent_scores`.

## Privacy Boundary

Scores are based only on captured interaction behavior:

- event type.
- repeat anonymous engagement.
- action depth.
- recency.
- compact multi-action sessions.
- source/referrer presence.
- coarse device metadata completeness.

The service does not use raw IP addresses, demographic inference, identity resolution, contact enrichment, or external data brokers.
