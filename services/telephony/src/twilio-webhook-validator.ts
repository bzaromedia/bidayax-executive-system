import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  LiveVoiceSafetyReasonCode,
  TwilioWebhookValidationInput,
  TwilioWebhookValidationResult
} from "@bidayax/types";

function getHeader(
  headers: Readonly<Record<string, string | null>>,
  name: string
) {
  const lowerName = name.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  return null;
}

function buildTwilioSignatureBase(
  url: string,
  params: Readonly<Record<string, string>>
) {
  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return `${url}${sortedEntries.map(([key, value]) => `${key}${value}`).join("")}`;
}

function safelyCompareSignature(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export function validateTwilioWebhookSignature({
  authToken,
  headers,
  params,
  productionMode,
  signingEnabled,
  url
}: TwilioWebhookValidationInput): TwilioWebhookValidationResult {
  const reasonCodes: LiveVoiceSafetyReasonCode[] = [];

  if (!signingEnabled) {
    if (productionMode) {
      reasonCodes.push("WEBHOOK_SIGNATURE_REQUIRED");
      return {
        reasonCodes,
        signingChecked: false,
        valid: false
      };
    }

    return {
      reasonCodes,
      signingChecked: false,
      valid: true
    };
  }

  const signature = getHeader(headers, "x-twilio-signature");

  if (!authToken || !signature) {
    reasonCodes.push("WEBHOOK_SIGNATURE_REQUIRED");
    return {
      reasonCodes,
      signingChecked: true,
      valid: false
    };
  }

  const expected = createHmac("sha1", authToken)
    .update(buildTwilioSignatureBase(url, params))
    .digest("base64");

  if (!safelyCompareSignature(expected, signature)) {
    reasonCodes.push("WEBHOOK_SIGNATURE_INVALID");
  }

  return {
    reasonCodes,
    signingChecked: true,
    valid: reasonCodes.length === 0
  };
}
