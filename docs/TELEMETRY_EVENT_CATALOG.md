# Telemetry Event Catalog

## Event Examples

- `card_view_logged`
- `interaction_event_created`
- `intent_score_calculated`
- `contact_graph_built`
- `receptionist_interaction_simulated`
- `telephony_readiness_checked`
- `safety_gate_evaluated`
- `dashboard_viewed`
- `api_request_completed`
- `api_request_failed`
- `database_query_failed`

## Required Fields

- `event_name`
- `subsystem`
- `severity`
- `status`
- `correlation_id` when available
- `duration_ms` when applicable
- `metadata`
- `created_at`

## Subsystems

- `card`
- `dashboard`
- `event_ledger`
- `intent_scoring`
- `contact_graph`
- `receptionist`
- `telephony`
- `provider_readiness`
- `system`
- `database`
- `security`

