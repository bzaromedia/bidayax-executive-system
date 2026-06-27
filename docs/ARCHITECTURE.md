# Architecture

## Architecture Name

The governing architecture is the Identity-to-Intelligence Architecture.

It converts executive identity and external interactions into structured events, scored intent, contact graph intelligence, dashboard insight, and follow-up automation.

## Layer Model

### 1. Design System Layer

Purpose: define visual and interaction primitives before screens exist.

Responsibilities:

- Tokens for color, type, spacing, radius, elevation, and motion.
- Component standards.
- Pattern and layout rules.
- Accessibility and responsive behavior.
- Storybook validation in a future phase.

Output: governed interface primitives used by all apps.

### 2. Executive Identity Layer

Purpose: define the trusted executive profile and business identity.

Responsibilities:

- Executive profile.
- Role and organization context.
- Brand expression.
- Contact channels.
- Availability and routing preferences.
- Public card metadata.
- Governance and consent state.

Output: an identity context attached to every interaction surface.

### 3. Interaction Capture Layer

Purpose: convert external actions into normalized events.

Inputs:

- QR scans.
- Card views.
- Calls.
- Emails.
- Scheduling actions.
- Form submissions.
- Manual notes.
- Receptionist actions.

Output: raw and normalized interaction events.

### 4. Event Ledger Layer

Purpose: preserve the durable timeline of what happened.

Responsibilities:

- Immutable event capture.
- Idempotency.
- Event source attribution.
- Processing status.
- Audit history.
- Replay support for future processors.

Output: canonical events for scoring, graph updates, dashboards, and automation.

Phase 4 implementation note: the first Event Ledger slice is `POST /api/events` in `apps/card` plus the PostgreSQL `interaction_events` table. It records public card interactions only and intentionally stops before scoring, graph updates, dashboards, and automation.

### 5. Intent Scoring Layer

Purpose: classify business priority and recommended urgency.

Responsibilities:

- Score identity strength.
- Score source quality.
- Score interaction type.
- Score urgency.
- Score business relevance.
- Score repeat engagement.
- Score conversation sentiment where available.
- Score follow-up probability.
- Score strategic value.
- Produce an explainable category.

Output categories:

- Cold Signal.
- Warm Signal.
- Qualified Signal.
- Executive Priority.
- Strategic Opportunity.

Phase 6 implementation note: the first Intent Scoring Layer slice is `services/intent-scoring` plus the PostgreSQL `intent_scores` table. It deterministically scores anonymous interaction groups and exposes reason codes. It intentionally stops before contact graph, CRM, receptionist workflows, machine learning, and automation.

### 6. Receptionist Agent Layer

Purpose: use identity, prior context, and scoring to qualify and route interactions.

Responsibilities:

- Answer or assist with phone interactions in future phases.
- Capture structured intake.
- Ask approved questions.
- Route to executive, delegate, or follow-up queue.
- Book meetings when qualified.
- Summarize calls.
- Trigger event ledger updates.
- Escalate uncertain or sensitive interactions to a human.

Output: logged receptionist actions and follow-up recommendations.

Phase 8 implementation note: the first Receptionist Agent Layer slice is `services/receptionist-agent` plus PostgreSQL receptionist foundation tables. It models simulated interactions, deterministic intent classification, language metadata, task generation, workflow events, and escalation recommendations. It intentionally stops before live calls, live voice sessions, real email sending, real calendar booking, CRM, external workflow engines, and autonomous production workflows.

### 7. Executive Contact Graph Layer

Purpose: connect people, companies, interactions, scores, history, and opportunity state.

Responsibilities:

- Link identities across channels.
- Maintain relationship strength.
- Attach interactions to people and companies.
- Attach scores and explanations.
- Track follow-up history.
- Track opportunity state.

Output: contact intelligence for dashboards, receptionist workflows, and automation.

Phase 7 implementation note: the first Executive Contact Graph slice is `services/contact-graph` plus PostgreSQL `contact_graph_nodes`, `contact_graph_edges`, and `contact_graph_snapshots`. It connects anonymous visitors, sessions, executives, interaction events, and intent scores. It intentionally stops before CRM, receptionist workflows, contact/company records, enrichment, identity resolution, and automation.

### 8. Dashboard Layer

Purpose: expose executive intelligence.

Responsibilities:

- Show priority contacts and opportunities.
- Explain why an interaction matters.
- Surface missed follow-ups.
- Show conversion and response metrics.
- Provide audit trails for decisions.

Output: actionable executive intelligence.

Phase 5 implementation note: the first Dashboard Layer slice is `apps/dashboard`. It reads `interaction_events` and shows truthful aggregate interaction metrics, recent anonymous activity, and basic conversion ratios. Phase 6 adds anonymous intent signals from `intent_scores`. Phase 7 adds graph summaries, relationship snapshots, and engagement paths from contact graph tables. Phase 8 adds simulated receptionist foundation visibility. It intentionally stops before CRM workflows and live receptionist actions.

### 9. Automation Layer

Purpose: close the loop with follow-up actions.

Responsibilities:

- Reminders.
- Follow-up messages.
- Meeting scheduling.
- Notification routing.
- Task creation.
- Escalation.
- Workflow triggers.

Output: measurable actions tied back to events and scores.

### 10. Governance Layer

Purpose: enforce trust, privacy, security, design consistency, and architectural discipline.

Responsibilities:

- Consent and privacy controls.
- Access control.
- Audit logging.
- Data retention rules.
- Design-system approval.
- Dependency approval.
- Architecture decision records in future phases.

Output: a product that remains trustworthy as it grows.

## Primary Flow

```text
Executive identity creates a governed card surface
-> External contact scans, calls, emails, or books
-> Interaction Capture normalizes the activity
-> Event Ledger records the canonical event
-> Intent Scoring classifies priority
-> Contact Graph links the event to people and companies
-> Receptionist or Automation chooses next action
-> Dashboard exposes the insight and outcome
```

## Monorepo Ownership

### apps/card

Future public executive card and QR interaction surface.

### apps/dashboard

Future executive intelligence dashboard.

### apps/receptionist-console

Future operator and receptionist workflow surface.

### packages/design-system

Future design-system implementation: tokens, components, patterns, layouts, templates, branding, typography, motion, icons, and Storybook.

### packages/ui

Future shared UI primitives that consume the design system.

### packages/tokens

Future design token source of truth.

### packages/config

Future shared TypeScript, lint, formatting, build, and test configuration.

### packages/types

Future shared domain and API types.

### packages/sdk

Future internal SDK for calling platform APIs from apps and workers.

### services/api

Future API boundary for apps and integrations.

### services/event-ledger

Future event ingestion and ledger processing service.

### services/intent-scoring

Future scoring service or module once scoring rules are validated.

### services/contact-graph

Future relationship graph builder and rebuild pathway for anonymous first-party interaction intelligence.

### services/receptionist-agent

Future receptionist workflow runtime.

Phase 8 starts this as a deterministic simulation package only.

### services/notification-worker

Future async notifications, reminders, and follow-up jobs.

## Technology Direction

The intended stack is:

- pnpm workspaces and TurboRepo for monorepo orchestration.
- Next.js, React, and TypeScript for apps.
- Tailwind CSS v4 through governed design tokens.
- Storybook for design-system development.
- GSAP and Motion for deliberate, measurable motion.
- PostgreSQL for durable structured data.
- Redis only when a measured need appears.
- Rust only where performance, reliability, or concurrency justify it.
- Docker, Caddy, and Hostinger VPS for deployment.

## Architecture Locks

- Event-first capture is mandatory.
- Scoring must be explainable.
- Contact intelligence must preserve relationship history.
- Design governance must precede UI screens.
- Automation must be auditable.
- Dependencies require justification.
- No production implementation exists in Phase 1.

## Open Questions For Phase 2 And Later

- Which executive card fields are required in the first vertical slice?
- What token taxonomy should govern brand, color, typography, spacing, and motion?
- What exact QR event payload should be captured first?
- What minimum contact graph model is sufficient for the first demo?
- Which receptionist workflow should be validated first: missed call recovery, lead qualification, or meeting booking?
