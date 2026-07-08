# Polyglot Receptionist Settings Integration

Phase 2E connects `ReceptionistSettings` to the Executive Card settings draft, preview, and publish pipeline without activating live providers.

## Flow

```text
Receptionist settings edit
-> card settings draft snapshot
-> receptionist validation
-> immutable receptionist preview
-> publish validation
-> published card settings snapshot
-> typed settings events for later Event Ledger persistence
```

## Active Capabilities

- typed voice, mood, language, greeting, consent, fallback, routing, escalation, recording, and appointment settings
- strict package-level validation
- immutable preview state
- receptionist settings included in the deterministic card snapshot hash
- publish blocked when receptionist settings are invalid
- dashboard preview of status, language coverage, active routes, effective greeting, and validation issues
- typed receptionist preview, failure, and publish events

## Dashboard Integration

The Phase 2E dashboard adapts the existing production `ReceptionistSettingsConfig` into the Phase 2 settings model for preview only. The adapter keeps the existing three executive card configurations intact and does not change card rendering or live workflow behavior.

The dashboard uses `@bidayax/settings` for validation and preview. Visual changes use existing `@bidayax/ui` components and token classes only.

## Events

- `receptionist.settings.previewed`
- `receptionist.settings.validation_failed`
- `receptionist.settings.published`

Events remain side-effect-free return values. Phase 2F now maps them to standardized audit envelopes and an immutable in-memory trail; durable Event Ledger persistence is still deferred.

## Explicitly Deferred

- live calls and call recording
- telephony or realtime voice providers
- provider credentials
- database migrations and persistence
- production settings mutation APIs
- direct calendar or email dispatch

No public capability claim should describe these deferred systems as active.
