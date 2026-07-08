# Receptionist Settings Model

Polyglot Receptionist settings define tenant-specific language, greeting, consent, fallback, routing, escalation, and appointment preferences. They configure settings snapshots; they do not activate live telephony or a provider.

## ReceptionistSettings

The typed model includes:

- tenant ownership and enabled state
- default and supported languages
- approved voice profile and mood
- standard or custom greeting
- fallback and after-hours behavior
- routing rules with condition, destination, intent, action, priority, and enabled state
- appointment policy
- escalation contacts with a valid name and contact method
- consent disclosure
- recording policy

Approved voice profiles are `executive`, `warm`, `energetic`, `calm`, `professional`, and `luxury`.
Approved moods are `confident`, `friendly`, `concise`, `formal`, `high_energy`, and `calm`.

## Validation

`@bidayax/settings` validates the model before preview and publish:

- `enabled` is boolean
- the default language is approved and included in supported languages
- an approved voice profile is present when enabled
- mood and greeting mode use approved enums
- custom mode includes a custom greeting
- standard mode includes a standard greeting
- consent disclosure exists when automation or recording is enabled
- fallback, recording, and after-hours behavior use approved values
- every routing rule includes condition, destination, and priority
- every escalation contact includes a name and a valid email or phone number

Validation returns structured issues and never mutates the source settings.

## Preview

`createReceptionistSettingsPreview` returns an immutable preview with the effective greeting, status, language summary, active route count, consent state, voice, mood, fallback, recording policy, and validation result.

## Provider Boundary

Phase 2E does not add Twilio, Vapi, Bland, Retell, SIP, or any other provider. It does not place calls, record audio, send messages, or modify production receptionist runtime behavior. Provider dispatch remains safety-gated and separately configured.
