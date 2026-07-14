# Voice Runtime Security

## Safety Controls

Phase 8 keeps the voice runtime provider-neutral and mock-only. Sensitive requests such as contract approval, payment, legal advice, medical claims, guarantees, or financial promises are routed to human approval instead of producing a commitment.

## Data Handling

Runtime audit events include metadata such as intent, confidence, tool plan, and provider status. They do not contain raw audio, credentials, provider tokens, cookies, or authorization headers.

## Production Gate

Production calling remains disabled. Future live voice runtime activation must pass identity, telephony, provider, consent, retention, prompt-injection, and abuse controls before any controlled production rollout.