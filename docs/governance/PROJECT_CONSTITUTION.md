# Project Constitution

Project: The Executive Card(TM)
Owner: BidayaX LLC
Status: Active governance

## Mission

Maintain a strict, evidence-based, linear production methodology.

The repository may not begin a future milestone before the current milestone is
architecturally defined, approved, implemented, tested, validated, documented,
independently reviewed, merged, and formally closed.

## Linear Production Policy

- Exactly one production milestone is active at a time.
- Exactly one subphase is active inside the active milestone.
- Future milestones may be documented for roadmap visibility, but they may not
  enter implementation early.
- Pull request numbers are not phase numbers.
- A phase is complete only when its canonical acceptance criteria and closure
  evidence are satisfied.
- A subphase is complete only when its closure evidence is accepted and merged.
- A merged pull request alone is not a phase closure record.
- Production deployment, production activation, provider enablement, and
  irreversible operations require the production authorization gate below.

## Production Authorization

Only the BidayaX LLC owner or an explicitly named production delegate may
authorize production access or production activation.

Production authorization must be recorded in a merged activation record that
identifies the approver, environment, provider, exact actions, scope, expiry,
rollback evidence, and validation evidence.

Before that merged activation record exists, the repository prohibits SSH, VPS,
hosting-control-panel access, production-data access, provider-console or
provider-API access, credential retrieval or provisioning, provider enablement,
deployment, and live communications execution.

## Frozen Capabilities

The following capabilities remain frozen until unlocked by an accepted ADR,
completed predecessor phases, and explicit owner authorization:

- Wallet
- payments expansion
- cryptocurrency
- digital assets
- loyalty
- rewards
- marketplace
- white-label expansion
- enterprise expansion
- speculative AI features
- experimental UI systems
- unrelated new platform integrations
- Version 2 implementation

Wallet implementation is specifically prohibited until the platform is
production-stable, all required preceding phases are complete, owner
authorization is explicit, and a dedicated Wallet ADR defines security,
compliance, custody, payment, ledger, fraud, and rollback requirements.

## Governance Links

- Canonical roadmap: `docs/governance/ROADMAP.md`
- Phase gate policy: `docs/governance/PHASE_GATE_POLICY.md`
- Current phase status: `docs/governance/CURRENT_PHASE_STATUS.md`
- Wallet freeze: `docs/governance/WALLET_FREEZE.md`
- ADR index: `docs/adr/README.md`
- Phase closure template: `docs/governance/PHASE_CLOSURE_TEMPLATE.md`
