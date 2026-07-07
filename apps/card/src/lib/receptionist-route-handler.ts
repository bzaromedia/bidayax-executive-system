import { NextResponse } from "next/server";
import { z } from "zod";
import {
  executiveSlugs,
  receptionistLanguages,
  receptionistRequestTypes,
  type ReceptionistRequest
} from "@bidayax/types";
import type { ReceptionistWorkflowSource } from "@bidayax/polyglot-receptionist";
import { processReceptionistWorkflowRequest } from "./receptionist-server-workflow";

const requestSchema = z
  .object({
    anonymousVisitorId: z.string().trim().min(8).max(128).optional(),
    company: z.string().trim().min(1).max(160).optional(),
    consent: z.literal(true),
    dialect: z.string().trim().min(1).max(80).optional(),
    email: z.string().trim().email().max(254),
    executiveSlug: z.enum(executiveSlugs),
    message: z.string().trim().min(10).max(2000),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(40).optional(),
    preferredLanguage: z.enum(receptionistLanguages),
    preferredTime: z.string().trim().min(1).max(160).optional(),
    requestType: z.enum(receptionistRequestTypes),
    sessionId: z.string().trim().min(8).max(128).optional(),
    sourceUrl: z.string().trim().url().max(2048).optional()
  })
  .strict();

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function rateLimitKey(request: Request, email: string, executiveSlug: string) {
  return [
    executiveSlug,
    email.toLowerCase(),
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  ].join(":");
}

function resolveWorkflowSource(
  source: ReceptionistWorkflowSource,
  requestType: ReceptionistRequest["requestType"]
): ReceptionistWorkflowSource {
  if (source === "web_form" && requestType === "request_callback") {
    return "callback_request";
  }

  return source;
}

export async function handleReceptionistRequestRoute(
  request: Request,
  source: ReceptionistWorkflowSource
) {
  const body = await parseJson(request);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_receptionist_request",
        providerStatus: "invalid",
        success: false
      },
      { status: 400 }
    );
  }

  try {
    const receptionistRequest: ReceptionistRequest = {
      consent: true,
      email: parsed.data.email,
      executiveSlug: parsed.data.executiveSlug,
      message: parsed.data.message,
      name: parsed.data.name,
      preferredLanguage: parsed.data.preferredLanguage,
      requestType: parsed.data.requestType,
      ...(parsed.data.company ? { company: parsed.data.company } : {}),
      ...(parsed.data.dialect ? { dialect: parsed.data.dialect } : {}),
      ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.preferredTime ? { preferredTime: parsed.data.preferredTime } : {})
    };
    const resolvedSource = resolveWorkflowSource(source, parsed.data.requestType);
    const result = await processReceptionistWorkflowRequest({
      anonymousVisitorId: parsed.data.anonymousVisitorId ?? null,
      executiveSlug: parsed.data.executiveSlug,
      rateLimitKey: rateLimitKey(request, parsed.data.email, parsed.data.executiveSlug),
      request: receptionistRequest,
      sessionId: parsed.data.sessionId ?? null,
      source: resolvedSource,
      sourceUrl: parsed.data.sourceUrl ?? null
    });
    const callbackWorkflow =
      parsed.data.requestType === "request_callback" && result.success
        ? {
            message: "Callback queued pending voice provider configuration.",
            provider: "manual_or_pending" as const,
            status: "queued" as const
          }
        : undefined;

    return NextResponse.json(
      {
        ...result,
        interactionMode:
          source === "chat_message" ? "chat" : source === "voice_chat" ? "voice_chat" : "form",
        ...(callbackWorkflow ? { callbackWorkflow } : {}),
        message: result.success
          ? "Request submitted. The receptionist will follow up shortly."
          : undefined
      },
      { status: result.statusCode }
    );
  } catch {
    return NextResponse.json(
      {
        error: "receptionist_request_failed",
        providerStatus: "event_store_unavailable",
        success: false
      },
      { status: 500 }
    );
  }
}
