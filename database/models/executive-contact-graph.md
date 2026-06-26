# Executive Contact Graph Model

Phase 7 adds a relational graph model that connects anonymous visitors, sessions, executive cards, interaction events, and deterministic intent scores.

## Tables

### contact_graph_nodes

Stores graph nodes with stable keys so rebuilds are idempotent.

- `visitor` nodes use `visitor:{anonymous_visitor_id}`.
- `session` nodes use `session:{session_id}`.
- `executive` nodes use `executive:{executive_slug}`.
- `interaction_event` nodes use `interaction_event:{event_id}`.
- `intent_score` nodes use `intent_score:{intent_score_id}`.

### contact_graph_edges

Stores graph relationships as relational edges. The unique constraint on `edge_type`, `source_node_id`, and `target_node_id` prevents duplicate edges.

### contact_graph_snapshots

Stores factual executive relationship snapshots by `executive_slug`, `anonymous_visitor_id`, and `session_id`.

## Privacy Rules

The graph does not store raw IP addresses, does not infer identity, and does not create contact or company records. Anonymous visitor and session identifiers remain anonymous behavior signals.
