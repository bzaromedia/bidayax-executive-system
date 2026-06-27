# Twilio Integration Guide

Phase 10 adds Twilio-compatible integration preparation. It does not execute
unrestricted live calls.

## Environment Variables

```text
TELEPHONY_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_SIGNING_ENABLED=false
VOICE_TEST_MODE=true
LIVE_INBOUND_CALLS_ENABLED=false
ALLOW_PRODUCTION_CALLS=false
```

Do not commit real values.

## Inbound Webhook

Route:

```text
POST /api/telephony/twilio/inbound
```

The route accepts Twilio-shaped form payloads with fields such as:

- `AccountSid`
- `CallSid`
- `From`
- `To`
- `CallStatus`
- `Direction`

It normalizes the payload into a BidayaX call model, optionally stores call
records if `DATABASE_URL` is configured, and returns safe TwiML.

## TwiML Response

The Phase 10 response:

- Acknowledges the call.
- States that BidayaX reception is being prepared or in test mode.
- May gather one keypad digit in test mode.
- Ends the call safely.

It does not start autonomous AI conversation.

## Webhook Signature Validation

`TWILIO_WEBHOOK_SIGNING_ENABLED=false` is allowed for local test mode.

If signing is disabled while production mode is requested, validation fails
closed with `WEBHOOK_SIGNATURE_REQUIRED`.

Production hardening should enable signature validation, verify deployment URLs,
and test provider callback behavior before any public phone routing.

