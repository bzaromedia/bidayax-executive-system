import type { RuntimeRedactionPolicy, RuntimeRedactionResult } from "./types";

export const defaultRuntimeRedactionPolicy: RuntimeRedactionPolicy = {
  redactEmails: true,
  redactLinks: true,
  redactPhoneNumbers: true,
  redactSecrets: true,
  transcriptPreviewMaxLength: 240
};

const secretPatterns = [
  /api[\s_-]*key\s*[:=]?\s*\S+/giu,
  /authorization\s*:\s*bearer\s+\S+/giu,
  /bearer\s+[A-Z0-9._~+/-]+=*/giu,
  /cookie\s*:\s*\S+/giu,
  /password\s*[:=]?\s*\S+/giu,
  /secret\s*[:=]?\s*\S+/giu,
  /(client|access|refresh)[\s_-]*token\s*[:=]?\s*\S+/giu,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/gu
];

const emailPatterns = [
  /[A-Z0-9._%+-]+\s*@\s*[A-Z0-9.-]+\s*\.\s*[A-Z]{2,}/giu,
  /[A-Z0-9._%+-]+\s*(\[at\]|\(at\)|\sat\s)\s*[A-Z0-9.-]+\s*(\[dot\]|\(dot\)|\sdot\s)\s*[A-Z]{2,}/giu,
  /[A-Z0-9._%+-]+\s*＠\s*[A-Z0-9.-]+\s*．\s*[A-Z]{2,}/giu
];

const phonePatterns = [
  /[+＋]?\d[\d\s().-]{7,}\d/gu,
  /\b(?:\d[\s.-]*){9,}\b/gu
];

function applyPatterns(input: string, patterns: readonly RegExp[], replacement: string): { readonly changed: boolean; readonly value: string } {
  const value = patterns.reduce((current, pattern) => current.replace(pattern, replacement), input);

  return {
    changed: value !== input,
    value
  };
}

export function redactRuntimeText(input: string, policy?: RuntimeRedactionPolicy): RuntimeRedactionResult {
  const resolved = {
    ...defaultRuntimeRedactionPolicy,
    ...policy,
    transcriptPreviewMaxLength: Math.max(0, Math.min(policy?.transcriptPreviewMaxLength ?? defaultRuntimeRedactionPolicy.transcriptPreviewMaxLength, 240))
  };
  const applied: string[] = [];
  let redacted = input.normalize("NFKC");

  if (resolved.redactSecrets) {
    const next = applyPatterns(redacted, secretPatterns, "[REDACTED_SECRET]");
    if (next.changed) {
      applied.push("SECRET_REDACTION_APPLIED");
    }
    redacted = next.value;
  }

  if (resolved.redactEmails) {
    const next = applyPatterns(redacted, emailPatterns, "[REDACTED_EMAIL]");
    if (next.changed) {
      applied.push("EMAIL_REDACTION_APPLIED");
    }
    redacted = next.value;
  }

  if (resolved.redactPhoneNumbers) {
    const next = applyPatterns(redacted, phonePatterns, "[REDACTED_PHONE]");
    if (next.changed) {
      applied.push("PHONE_REDACTION_APPLIED");
    }
    redacted = next.value;
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
