import type { ReceptionistRequest } from "@bidayax/types";
import type { ReceptionistProviderConfig } from "./workflow-nodes";

export const defaultReceptionistHandoffEmail = "contact@theexecutivecard.com";

function formatRequestType(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function resolveReceptionistProviderConfigFromEnv(
  env: Record<string, string | undefined> = process.env
): ReceptionistProviderConfig {
  const emailConfigured = Boolean(env.EMAIL_HOST && env.EMAIL_USERNAME && env.EMAIL_PASSWORD);
  const telephonyConfigured =
    env.TELEPHONY_PROVIDER === "twilio" &&
    Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
  const calendarConfigured = Boolean(env.CALENDAR_PROVIDER && env.CALENDAR_PROVIDER !== "none");

  return {
    calendarConfigured,
    calendarDispatchEnabled: calendarConfigured && env.CALENDAR_DISPATCH_ENABLED === "true",
    emailConfigured,
    emailDispatchEnabled: emailConfigured && env.EMAIL_DISPATCH_ENABLED === "true",
    telephonyConfigured,
    telephonyDispatchEnabled: telephonyConfigured && env.LIVE_INBOUND_CALLS_ENABLED === "true"
  };
}

export function createReceptionistEmailNotification(input: {
  readonly request: ReceptionistRequest;
  readonly executiveName: string;
  readonly handoffEmail: string;
}) {
  const subject = `[The Executive Card] Receptionist Request - ${input.executiveName} - ${formatRequestType(input.request.requestType)}`;
  const body = [
    `Executive: ${input.executiveName}`,
    `Request type: ${formatRequestType(input.request.requestType)}`,
    `Name: ${input.request.name}`,
    `Email: ${input.request.email}`,
    `Phone: ${input.request.phone ?? "Not provided"}`,
    `Company: ${input.request.company ?? "Not provided"}`,
    `Preferred language: ${input.request.preferredLanguage}`,
    `Dialect: ${input.request.dialect ?? "Not provided"}`,
    `Preferred time: ${input.request.preferredTime ?? "Not provided"}`,
    "",
    "Message:",
    input.request.message
  ].join("\n");

  return {
    body,
    subject,
    to: input.handoffEmail || defaultReceptionistHandoffEmail
  };
}
