# Receptionist Settings Model

Polyglot Receptionist settings define how each tenant routes messages, callbacks, scheduling requests, and future provider-backed voice workflows.

## ReceptionistSettings

Fields:

- `tenantId`
- `enabled`
- `defaultLanguage`
- `supportedLanguages[]`
- `voiceProfile`
- `mood`
- `greetingMode`
- `standardGreeting`
- `customGreeting`
- `fallbackBehavior`
- `callRoutingRules[]`
- `appointmentRules`
- `afterHoursBehavior`
- `escalationContacts[]`
- `consentDisclosure`
- `recordingPolicy`

## Provider Boundary

These settings configure workflow behavior. They do not activate live telephony, realtime voice, outbound email, SMS, or direct calendar booking unless provider credentials and safety flags are configured and tested.

## Safety Requirements

- Custom greetings must be non-empty, safe, and free of unsupported claims.
- Recording policy must match consent disclosure.
- Routing rules must use allowlisted actions.
- Sensitive intents must be routed to human review.
- Unsupported languages fall back to the tenant default language.

## Phase Relationship

Phase 2A defines the model. Phase 2E integrates these settings into the active receptionist workflow in a broader pass.
