# QR Transfer Feedback System

Project: The Executive Card  
Owner: BidayaX LLC  
Status: v1.0 production card capability

## Purpose

The QR Transfer Feedback System gives the receiving device a short confirmation when a production card opens from a QR-marked URL. It reinforces that the executive card was received while preserving all existing card routes, event logging, QR generation, vCard downloads, downloads, calendar booking, receptionist workflows, and dashboard visibility.

## v1.0 Scope

The v1.0 implementation is receiver device only. A QR scan can trigger haptics, sound, and animation on the device that opens the web card URL. It does not trigger haptics on the device displaying the QR code.

Sender-side feedback requires an active paired web session or native bridge. Without that paired connection, a normal QR scan gives the web app no reliable channel back to the sender device.

## Trigger Conditions

Receiver-side feedback appears when the opened card URL includes one of these QR markers:

- `?source=qr`
- `?scan=1`
- legacy-compatible `?entry=qr`
- `?utm_source=qr`

Production QR values now encode card URLs as:

```text
https://theexecutivecard.online/card/[slug]?source=qr
```

Direct card URLs such as `https://theexecutivecard.online/card/ad-garner` still render normally without transfer feedback.

## Feedback Behavior

- Haptics use `navigator.vibrate()` only when the browser and device support it.
- Success haptic pattern: `[35, 20, 45]`.
- Failure haptic pattern: `[70, 35, 70]`.
- Sound uses generated Web Audio tones only; no audio files are loaded.
- Sound is off by default and requires the receiver to enable it.
- Animation is on by default but respects reduced-motion preferences.
- Unsupported haptics or sound are not errors and do not show failure feedback.
- The confirmation is non-blocking and can be dismissed.
- The confirmation includes a `Save Contact` action for the current executive vCard.

## Settings

Receiver-side settings are stored in browser `localStorage` under:

```text
the-executive-card.transfer-feedback-settings
```

Default settings:

```json
{
  "hapticsEnabled": true,
  "soundEnabled": false,
  "animationEnabled": true
}
```

## Event Logging

The system emits these additional event names through the existing card event helper:

- `qr_transfer_detected`
- `qr_transfer_success_feedback`
- `qr_transfer_failure_feedback`
- `qr_transfer_haptics_toggled`
- `qr_transfer_sound_toggled`
- `qr_transfer_animation_toggled`

Event logging is fail-safe and must never block card usage.

## Validation Notes

Owner device validation is required for vibration support because support varies by browser, operating system, and device model. iOS Safari, Android Chrome, desktop Chrome, Edge, Firefox, and Safari should be tested for graceful behavior.

Failure feedback is reserved for invalid profile, invalid route, or validation failures where the card route can explicitly detect a problem. Lack of vibration support, lack of sound permission, or disabled settings are not failure conditions.