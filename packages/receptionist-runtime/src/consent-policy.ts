import type { RuntimeConsentInput, RuntimeConsentPolicy, RuntimeConsentResult, VoiceRuntimeMode } from "./types";

export const defaultRuntimeConsentPolicy: RuntimeConsentPolicy = {
  automationDisclosureRequired: true,
  recordingConsentRequired: true,
  transcriptRetentionNoticeRequired: true
};

export function evaluateRuntimeConsent(input: {
  readonly consent?: RuntimeConsentInput;
  readonly mode: VoiceRuntimeMode;
  readonly policy?: RuntimeConsentPolicy;
}): RuntimeConsentResult {
  if (!input.consent) {
    return {
      allowed: true,
      reasonCodes: ["CONSENT_NOT_REQUIRED_FOR_CONTEXT"],
      status: "not_required"
    };
  }

  const policy = input.policy ?? defaultRuntimeConsentPolicy;
  const consent = input.consent;
  const reasonCodes: string[] = [];
  const recordingRequested = Boolean(consent.recordingRequested);

  if (policy.automationDisclosureRequired && !consent.automationDisclosureAccepted) {
    reasonCodes.push("AUTOMATION_DISCLOSURE_REQUIRED");
  }

  if (policy.transcriptRetentionNoticeRequired && !consent.transcriptRetentionAccepted) {
    reasonCodes.push("TRANSCRIPT_RETENTION_NOTICE_REQUIRED");
  }

  if ((recordingRequested || input.mode === "phone_simulation") && policy.recordingConsentRequired && !consent.recordingConsentGranted) {
    reasonCodes.push("RECORDING_CONSENT_REQUIRED");
  }

  if (consent.consentDenied) {
    reasonCodes.push("CONSENT_DENIED");
  }

  if (reasonCodes.includes("CONSENT_DENIED")) {
    return {
      allowed: false,
      reasonCodes,
      status: "denied"
    };
  }

  if (reasonCodes.length > 0) {
    return {
      allowed: false,
      reasonCodes,
      status: "missing"
    };
  }

  return {
    allowed: true,
    reasonCodes: ["CONSENT_VALIDATED"],
    status: "granted"
  };
}
