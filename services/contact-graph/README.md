# BidayaX Contact Graph Service

Phase 7 creates the Executive Contact Graph foundation. It converts first-party `interaction_events` and deterministic `intent_scores` into relational graph nodes, edges, and factual snapshots.

## Commands

```bash
pnpm --filter @bidayax/contact-graph test
pnpm --filter @bidayax/contact-graph build
pnpm --filter @bidayax/contact-graph rebuild
```

`rebuild` requires `DATABASE_URL` and the Phase 4, Phase 6, and Phase 7 migrations.

## Scope

This service does not identify anonymous visitors, enrich contacts, create a CRM, or automate receptionist workflows. It only organizes existing first-party interaction data into a rebuildable graph.
