# Wallet Freeze

Status: Active governance

Wallet, payments expansion, cryptocurrency, digital assets, loyalty, rewards,
marketplace, and related commercial asset systems are frozen.

## Prohibited Work

Do not create Wallet implementation code, migrations, routes, UI, contracts,
services, packages, provider integrations, payment flows, custody flows, ledger
systems, rewards mechanics, or marketplace behavior.

Production reconciliation and environment validation must fail closed if Wallet
or future asset issuance flags are enabled.

## Unlock Requirements

Wallet planning may begin only after:

- the platform is production-stable;
- required preceding phases are complete;
- the owner explicitly authorizes Wallet planning;
- a dedicated Wallet ADR is accepted;
- security, compliance, custody, payment, ledger, fraud, rollback, and incident
  requirements are defined.

Future Wallet concepts may be preserved only in a clearly non-active deferred
roadmap document when necessary to prevent loss of an idea.
