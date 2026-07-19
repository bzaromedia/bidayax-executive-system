# Channel Adapter Contract

## Purpose

Channel adapters convert transport-specific behavior into communications-domain commands, statuses, and events.

## Required Capabilities

- capability discovery
- command submission
- command cancellation
- normalized status
- normalized events
- health status
- idempotency handling
- sandbox mode
- shutdown behavior

## Contract Rules

- adapters consume communications-domain commands
- adapters return normalized, provider-neutral results
- adapters report transport-native states separately from normalized lifecycle states
- adapters never own authorization, consent, suppression, routing, or audit policy
- adapters never enable production execution on their own
