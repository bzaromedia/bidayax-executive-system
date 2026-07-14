import type { RuntimeRedactionPolicy, RuntimeRedactionResult } from "./types";

export const defaultRuntimeRedactionPolicy: RuntimeRedactionPolicy = {
  redactEmails: true,
  redactLinks: true,
  redactPhoneNumbers: true,
  redactSecrets: true,
  transcriptPreviewMaxLength: 240
};

const secretPatterns = [
  /api[_-]?key\s*[:=]\s*\S+/giu,
  /authorization:\s*bearer\s+\S+/giu,
  /cookie:\s*\S+/giu,
  /password\s*[:=]\s*\S+/giu,
  /secret\s*[:=]\s*\S+/giu
];

export function redactRuntimeText(input: string, policy?: RuntimeRedactionPolicy): RuntimeRedactionResult {
  const resolved = {
    ...defaultRuntimeRedactionPolicy,
    ...policy
  };
  const applied: string[] = [];
  let redacted = input;

  if (resolved.redactSecrets) {
    const next = secretPatterns.reduce((value, pattern) => value.replace(pattern, "[REDACTED_SECRET]"), redacted);
    if (next !== redacted) {
      applied.push("SECRET_REDACTION_APPLIED");
    }
    redacted = next;
  }

  if (resolved.redactEmails) {
    const next = redacted.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[REDACTED_EMAIL]");
    if (next !== redacted) {
      applied.push("EMAIL_REDACTION_APPLIED");
    }
    redacted = next;
  }

  if (resolved.redactPhoneNumbers) {
    const next = redacted.replace(/\+?\d[\d\s().-]{7,}\d/gu, "[REDACTED_PHONE]");
    if (next !== redacted) {
      applied.push("PHONE_REDACTION_APPLIED");
    }
    redacted = next;
  }

  if (resolved.redactLinks) {
    const next = redacted.replace(/https?:\/\/\S+/giu, "[REDACTED_LINK]");
    if (next !== redacted) {
      applied.push("LINK_REDACTION_APPLIED");
    }
    redacted = next;
  }

  return {
    applied: applied.length > 0 ? applied : ["NO_REDACTION_REQUIRED"],
    policy: resolved,
    redactedText: redacted.slice(0, resolved.transcriptPreviewMaxLength)
  };
}
