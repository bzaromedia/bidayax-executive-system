# Telephony Cost Model

Phase 6 introduces an append-only usage ledger with future cost categories:

- provider minutes
- future AI runtime
- future transcription
- future TTS
- future STT
- recording storage
- callback attempts
- appointment requests

All current rates are zero. This prevents unsupported billing claims before a provider and pricing policy exist. Future phases may map provider invoice events to ledger entries without changing domain history.
