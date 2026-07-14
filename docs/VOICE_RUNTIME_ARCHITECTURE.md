# Voice Runtime Architecture

## Runtime Position

The voice runtime sits between the Polyglot Receptionist workflow layer and future speech/voice providers.

```text
Visitor text or audio
  -> Voice Runtime
  -> STT interface or text passthrough
  -> Language and intent engines
  -> Tool planner
  -> Dialogue policy
  -> TTS interface
  -> Audit events
```

## Provider Boundary

Speech recognition and synthesis are interfaces. Phase 8 ships only mock implementations. Future providers must plug into these interfaces without owning tenant authorization, call state, audit policy, or production safety gates.

## Runtime Guarantees

- deterministic state transitions
- mock-only provider status
- human approval for sensitive requests
- safe fallback for unknown intent
- sanitized audit events
- no raw audio storage
- no production calling