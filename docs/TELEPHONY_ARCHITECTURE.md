# Telephony Architecture

The architecture is provider-independent:

Executive Card -> BidayaX Telephony Control Plane -> Provider Adapter Interface -> Future Provider

The Telephony Control Plane owns domain decisions. Future providers only implement adapter contracts. Provider metadata may be stored as references, but provider behavior does not define tenant ownership, card access, routing policy, usage ledger rules, or audit requirements.

Core layers:

- Domain types in `@bidayax/types`.
- State-machine and orchestration services in `@bidayax/telephony`.
- Tenant/card-safe persistence in migration `0016`.
- Provider-neutral dashboard visibility in `apps/dashboard`.
- Future provider adapter interfaces in `services/telephony/src/provider-interface.ts`.

The domain is intentionally ready for future adapters without installing any provider SDK.
