import type {
  RuntimeConsentInput,
  RuntimeConsentPolicy,
  RuntimeConsentResult,
  RuntimeConsentSensitiveCapability,
  VoiceRuntimeMode
} from "./types";

export const defaultRuntimeConsentPolicy: RuntimeConsentPolicy = {
  automationDisclosureRequired: true,
  recordingConsentRequired: true,
  transcriptRetentionNoticeRequired: true
};

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function consentRequirementCodes(input: {
  readonly mode: VoiceRuntimeMode;
  readonly requestedCapabilities?: readonly RuntimeConsentSensitiveCapability[];
}): readonly string[] {
  const reasonCodes: string[] = [];
  const capabilities = input.requestedCapabilities ?? [];

  if (input.mode === "voice_chat" || input.mode === "phone_simulation" || capabilities.includes("live_voice")) {
    reasonCodes.push("LIVE_VOICE_CONSENT_CONTEXT_REQUIRED");
  }

  if (capabilities.includes("transcription")) {
    reasonCodes.push("TRANSCRIPTION_CONSENT_CONTEXT_REQUIRED");
  }

  if (capabilities.includes("recording")) {
    reasonCodes.push("RECORDING_CONSENT_CONTEXT_REQUIRED");
  }

  if (capabilities.includes("sensitive_tool")) {
    reasonCodes.push("SENSITIVE_TOOL_CONSENT_CONTEXT_REQUIRED");
  }

  return unique(reasonCodes);
}

export function evaluateRuntimeConsent(input: {
  readonly consent?: RuntimeConsentInput;
  readonly mode: VoiceRuntimeMode;
  readonly policy?: RuntimeConsentPolicy;
  readonly requestedCapabilities?: readonly RuntimeConsentSensitiveCapability[];
}): RuntimeConsentResult {
  const requirementCodes = consentRequirementCodes({
    mode: input.mode,
    ...(input.requestedCapabilities ? { requestedCapabilities: input.requestedCapabilities } : {})
  });

  if (!input.consent) {
    if (requirementCodes.length > 0) {
      return {
        allowed: false,
        reasonCodes: ["CONSENT_CONTEXT_REQUIRED", ...requirementCodes],
        status: "missing"
      };
    }

    return {
      allowed: true,
      reasonCodes: ["CONSENT_NOT_REQUIRED_FOR_CONTEXT"],
      status: "not_required"
    };
  }

  const policy = input.policy ?? defaultRuntimeConsentPolicy;
  const consent = input.consent;
  const reasonCodes: string[] = [];
  const recordingRequested = Boolean(consent.recordingRequested) || input.requestedCapabilities?.includes("recording") === true;

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
      reasonCodes: unique(reasonCodes),
      status: "denied"
    };
  }

  if (reasonCodes.length > 0) {
    return {
      allowed: false,
      reasonCodes: unique(reasonCodes),
      status: "missing"
    };
  }

  return {
    allowed: true,
    reasonCodes: ["CONSENT_VALIDATED"],
    status: "granted"
  };
}
