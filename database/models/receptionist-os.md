# Receptionist OS Foundation Model

Phase 8 introduces the Polyglot Receptionist OS foundation. The tables store simulated receptionist interactions, generated tasks, conversation turns, and workflow events.

## Tables

### receptionist_interactions

Stores high-level receptionist records. Phase 8 rows are simulation/foundation records and must not be treated as live call, email, or scheduling automation.

### receptionist_tasks

Stores explainable tasks generated from simulated receptionist intent classification. Tasks are not completed automatically.

### receptionist_conversation_turns

Stores simulated conversation turns. Phase 8 does not store live call recordings.

### receptionist_workflow_events

Stores internal workflow state changes such as language detection, intent classification, task creation, escalation recommendation, and summary generation.

## Privacy Rules

Phase 8 does not store raw call recordings, payment data, sensitive personal data, external enrichment, or inferred protected traits. `caller_or_sender` is optional and should remain limited until later consent and identity rules exist.
