import type {
  ReceptionistNotificationPayload,
  ReceptionistRequest
} from "@bidayax/types";

const receptionistInbox = "contact@theexecutivecard.com";

function formatRequestType(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function createReceptionistNotificationPayload(
  request: ReceptionistRequest,
  executiveName: string
): ReceptionistNotificationPayload {
  const subject = `[The Executive Card] Receptionist Request - ${executiveName} - ${formatRequestType(request.requestType)}`;
  const body = [
    `Executive: ${executiveName}`,
    `Request type: ${formatRequestType(request.requestType)}`,
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    `Phone: ${request.phone ?? "Not provided"}`,
    `Company: ${request.company ?? "Not provided"}`,
    `Preferred language: ${request.preferredLanguage}`,
    `Dialect: ${request.dialect ?? "Not provided"}`,
    `Preferred time: ${request.preferredTime ?? "Not provided"}`,
    "",
    "Message:",
    request.message
  ].join("\n");

  return {
    body,
    request,
    subject,
    to: receptionistInbox
  };
}

export function getReceptionistNotificationStatus() {
  const hasSmtp =
    Boolean(process.env.EMAIL_HOST) &&
    Boolean(process.env.EMAIL_USERNAME) &&
    Boolean(process.env.EMAIL_PASSWORD);

  return hasSmtp ? "email_ready" : "provider_unconfigured";
}

