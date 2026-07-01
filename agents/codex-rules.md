# Codex Rules

## Project Identity

The Executive Card is an Executive Identity Intelligence System owned by BidayaX LLC. It is not a generic digital card, receptionist bot, CRM clone, or dashboard.

Every change must support the loop:

```text
Identity
-> Interaction
-> Event Ledger
-> Intent Scoring
-> Receptionist Action
-> Contact Graph
-> Executive Dashboard
-> Follow-up Automation
```

## Operating Constraints

- Stay inside the active phase.
- Prefer simple vertical slices.
- Avoid speculative infrastructure.
- Avoid broad abstractions until two real use cases exist.
- Do not add dependencies without documenting the reason.
- Do not introduce production behavior without acceptance criteria.
- Do not bypass the design-system supply chain.
- Do not hide scoring or automation reasoning.
- Do not create data structures that cannot be audited.

## Documentation Rules

Update source-of-truth docs when changing:

- System thesis.
- Architecture.
- Algorithms.
- Contact graph or database model.
- Event ledger semantics.
- Design-system governance.
- Security model.
- Deployment model.
- Acceptance criteria.

## Design Rules

Future UI must flow through:

```text
tokens -> components -> patterns -> layouts -> templates -> apps
```

No app screen should define local colors, typography, spacing, radius, elevation, motion, icons, or new component semantics unless the design-system approval path is documented.

## Data And Security Rules

- Treat personal data and interaction history as sensitive.
- Preserve consent state.
- Make automation auditable.
- Keep score explanations visible.
- Store identity confidence separately from identity claims.
- Retain correction history for contacts and scores.
- Use least privilege for humans and services.

## Future Implementation Rules

When production code begins:

- Prefer TypeScript for application and shared platform code.
- Use Rust only when a concrete reliability, performance, or concurrency need appears.
- Use PostgreSQL as the default durable store.
- Add Redis only when measured latency, queueing, caching, or coordination needs justify it.
- Add tests before broadening behavior.
- Add logs and metrics for event, score, workflow, and follow-up outcomes.
