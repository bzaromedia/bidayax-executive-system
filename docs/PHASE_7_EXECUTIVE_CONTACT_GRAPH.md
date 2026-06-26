# Phase 7 - Executive Contact Graph

## Goal

Phase 7 creates the Executive Contact Graph: a deterministic, privacy-respecting relationship layer built from `interaction_events` and `intent_scores`.

## Implemented Files

- `packages/types/src/graph.ts`
- `services/contact-graph`
- `database/migrations/0003_create_contact_graph.sql`
- `database/models/executive-contact-graph.md`
- `apps/dashboard/src/data/graph-queries.ts`
- `apps/dashboard/src/components/ContactGraphSummary.tsx`
- `apps/dashboard/src/components/ExecutiveRelationshipSnapshot.tsx`
- `apps/dashboard/src/components/EngagementPathList.tsx`
- `apps/dashboard/src/components/GraphEmptyState.tsx`

## Graph Tables

### contact_graph_nodes

Stores nodes by type and stable key.

### contact_graph_edges

Stores typed relationships between nodes. A unique constraint on source, target, and edge type prevents duplicates.

### contact_graph_snapshots

Stores factual visitor-session-executive summaries for dashboard use.

## Deterministic Builder

`services/contact-graph/src/build-graph-from-events.ts` accepts interaction events and intent scores and returns:

- graph nodes.
- graph edges.
- relationship snapshots.
- duplicate prevention counts.

The pure builder is independent of the database and UI.

## Rebuild Path

`services/contact-graph/src/graph-queries.ts` reads PostgreSQL, builds the graph, and upserts nodes, edges, and snapshots.

Run:

```bash
DATABASE_URL=postgres://... pnpm --filter @bidayax/contact-graph rebuild
```

## Dashboard Updates

The dashboard reads the graph tables and shows:

- contact graph summary.
- executive relationship snapshots.
- engagement paths.
- graph empty state.

It does not expose raw anonymous visitor IDs, session IDs, IP addresses, or IP hashes.

## Acceptance Questions

1. Does the graph use real interaction and intent data?
   - Yes. It reads `interaction_events` and `intent_scores`.
2. Does the graph avoid identity guessing?
   - Yes. It keeps visitor and session data anonymous.
3. Is the graph idempotent and rebuildable?
   - Yes. Nodes use stable keys and edges use uniqueness constraints.
4. Are nodes and edges explainable?
   - Yes. Node and edge types are explicit shared types.
5. Are snapshots factual?
   - Yes. Snapshot language describes observed actions only.
6. Is privacy preserved?
   - Yes. No raw IPs, enrichment, demographic inference, or identity resolution are used.
7. Does this support future receptionist and CRM workflows without becoming a CRM?
   - Yes. It creates relationship structure only.

## Explicit Non-Goals

Phase 7 does not build CRM, receptionist automation, contact enrichment, lead scoring, scheduling, sales pipelines, external data broker integrations, identity resolution, or recursive improvement automation.
