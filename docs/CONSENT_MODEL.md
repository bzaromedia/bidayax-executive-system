# Consent Model

## Purpose

The receptionist runtime must know whether it is allowed to process automation, transcript previews, and future recording-related actions before it performs workflow actions.

## Current Implementation

The Phase 9 runtime supports these consent inputs:

- `automationDisclosureAccepted`
- `recordingConsentGranted`
- `recordingRequested`
- `transcriptRetentionAccepted`
- `consentDenied`

If no consent context is supplied, the mock-only runtime treats consent as `not_required` to preserve current provider-neutral behavior. Once card or provider flows supply consent context, missing required consent fails closed.

## Blocking Conditions

- Explicit consent denial.
- Missing automation disclosure acceptance when consent context is supplied.
- Missing transcript retention acceptance when consent context is supplied.
- Missing recording consent for phone simulation or recording-requested contexts.

## Not Implemented

No jurisdiction-specific legal consent rules are claimed. Final recording and disclosure behavior must be reviewed for the actual deployment jurisdictions before live calling or recording.
