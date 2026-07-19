import type { ReceptionistRequest } from "@bidayax/types";

export const defaultReceptionistHandoffEmail = "contact@theexecutivecard.com";

function formatRequestType(value: string) {
  return value
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
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