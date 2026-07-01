# Release Scope

Project: The Executive Card  
Owner: BidayaX LLC  
Public URL: https://theexecutivecard.online  
Release target: v1.0 enterprise readiness gate

## v1.0 Included Scope

The v1.0 release scope includes only systems that are present in the source tree, covered by repository checks, and buildable through the root commands.

The Executive Card v1.0 includes only implemented, tested, production-buildable capabilities. Deferred enterprise trust layers are not active product capabilities in v1.0.

- Monorepo foundation: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, shared TypeScript config, workspace package graph.
- Design system: `packages/tokens`, `packages/ui`, `packages/design-system`, Storybook configuration, accessibility and governance documentation.
- Digital executive card: `apps/card`.
- QR interaction event ledger: `apps/card/app/api/events/route.ts` and migration `0001`.
- Executive interaction dashboard: `apps/dashboard`.
- Executive intent scoring: `services/intent-scoring` and migration `0002`.
- Executive contact graph: `services/contact-graph` and migration `0003`.
- Polyglot receptionist workflow foundation: `services/receptionist-agent` and migration `0004`, limited to deterministic workflow classification, task generation, and escalation recommendations.
- Safety-gated future telephony integration: `services/telephony` and migration `0005`, limited to provider-boundary readiness, inbound normalization, outbound request preparation, and approval gating.
- Voice runtime safety: `services/telephony` and migration `0006`, limited to readiness checks, safety gates, blocked-by-default production voice, and test-mode defaults.
- Observability and telemetry foundation: `services/telemetry`, telemetry API routes, observability dashboard surfaces, and migration `0007`.
- Evolutionary improvement engine foundation: `services/improvement-engine`, dashboard routes, and migration `0008`, limited to evidence-based opportunity/candidate workflows with human approval.
- Production hardening foundation: environment validation, safe defaults, health/readiness routes, Docker/Hostinger deployment artifacts, and operational docs.
- Recovery stabilization: Git usability, clean workspace dependencies, honest package exports, governance files, and release verification scripts.
- Data trust and policy-enforcement foundations: `packages/types/src/data-trust.ts`, `packages/types/src/policy-enforcement.ts`, and `services/policy-enforcement`, limited to deterministic assessment and explainable policy evaluation.

## v1.0 Excluded Or Deferred Scope

The following systems are not active production capabilities in v1.0 unless a later release adds source, tests, migrations, API integration, docs, and release verification:

- Specialist Agent Collective.
- Full Data Trust Fabric persistence, lineage graph, evidence ledger, and revocation ledger.
- Verification Layer.
- IP Trust Fabric.
- Bank Trust Layer.
- Continuous Reverification.
- Enterprise Platform Readiness layer beyond the current release-readiness documentation.
- Operational Excellence + Scale Validation, including load tests, capacity tests, and restore-drill evidence.
- Technical Data Room + Commercialization artifacts.
- Certification Readiness control mappings and formal evidence packages.
- Public marketing website under `apps/marketing`.
- Future workspace directories listed in `docs/roadmap/DEFERRED_RELEASE_SCOPE.md`.

## Public Claim Rules

Public docs, dashboard copy, README content, and future marketing pages must follow these rules:

- Receptionist capability in v1.0 must be described as workflow foundation unless live production receptionist capability is fully implemented.
- Live voice and telephony must be described as a safety-gated future integration unless real provider production setup exists.
- The improvement engine must be described as a human-approved recommendation foundation unless implementation/deployment automation exists.
- Data trust and policy enforcement must be described as foundations unless persistence, auditability, and API enforcement are implemented in a future release.
- Verification Layer, IP Trust Fabric, Bank Trust Layer, Specialist Agent Collective, certification readiness, and commercialization assets must be described as deferred or future roadmap items.
- The repository must not claim compliance certification.

## Marketing Gate

Marketing work may begin only after `FINAL_ENTERPRISE_ACCEPTANCE_REPORT.md` returns either:

- READY FOR ENTERPRISE RELEASE
- READY AFTER MINOR FIXES with no blocking defects

The marketing site must not imply deferred systems are active v1.0 capabilities.
