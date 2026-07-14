# Consent Model

## Purpose

The receptionist runtime must know whether it is allowed to process automation, transcript previews, and future recording-related actions before it performs workflow actions.

## Current Implementation

The Phase 9G runtime supports these consent inputs:

- `automationDisclosureAccepted`
- `recordingConsentGranted`
- `recordingRequested`
- `transcriptRetentionAccepted`
- `consentDenied`

Absent consent context is allowed only for non-consent-sensitive text contexts. Unknown consent fails closed for voice chat, phone simulation, transcription, recording, live-voice-like paths, and sensitive tool execution.

## Blocking Conditions

- Explicit consent denial.
- Missing automation disclosure acceptance when consent context is supplied.
- Missing transcript retention acceptance when consent context is supplied.
- Missing recording consent for phone simulation or recording-requested contexts.
- Missing consent context for voice, transcription, recording, live voice, or sensitive tool capability.

## Not Implemented

No jurisdiction-specific legal consent rules are claimed. Final recording and disclosure behavior must be reviewed for the actual deployment jurisdictions before live calling or recording.
