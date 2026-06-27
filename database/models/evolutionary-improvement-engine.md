# Evolutionary Improvement Engine Model

Phase 13 adds proposal and approval-tracking tables only.

## Tables

- `improvement_opportunities`: telemetry-backed opportunities detected by deterministic rules.
- `improvement_candidates`: proposed improvements generated from opportunities.
- `improvement_lineage_archive`: lineage and review archive for every candidate.
- `improvement_approval_events`: human approval, rejection, blocked, or needs-more-evidence decisions.

## Safety Rules

- Candidates do not mutate code.
- Candidates do not deploy.
- Approval does not deploy.
- `metrics_after`, `test_results`, and `benchmark_results` remain `null` in Phase 13.
- Rollback plans are required for every lineage entry.
- Raw secrets, raw provider payloads, raw audio, raw IPs, and fake improvements are not stored.

## Future Phases

Phase 14 may introduce controlled specialist agent roles and sandbox evaluation. Production promotion must still require lineage, review, approval, and rollback controls.
