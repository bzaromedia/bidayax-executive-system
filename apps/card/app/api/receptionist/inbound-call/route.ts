import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeInboundCallWebhook, runSimulatedInboundCallWorkflow } from "@bidayax/polyglot-receptionist";
import { executiveSlugs, receptionistLanguages } from "@bidayax/types";
import { processReceptionistWorkflowRequest } from "@/lib/receptionist-server-workflow";
import { getExecutiveProfileBySlug } from "@bidayax/config/executives";

export const runtime = "nodejs";

const inboundCallSchema = z
  .object({
    callerEmail: z.string().trim().email().max(254),
    callerName: z.string().trim().min(2).max(120),
    callerPhone: z.string().trim().min(7).max(40),
    consent: z.literal(true),
    dialect: z.string().trim().min(1).max(80).optional(),
    executiveSlug: z.enum(executiveSlugs),
    preferredLanguage: z.enum(receptionistLanguages).optional(),
    sessionId: z.string().trim().min(8).max(128).optional(),
    transcript: z.string().trim().min(10).max(2000).optional()
  })
  .strict();

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const parsed = inboundCallSchema.safeParse(await parseJson(request));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_inbound_call_payload", providerStatus: "invalid", success: false },
      { status: 400 }
    );
  }

  const receptionistRequest = normalizeInboundCallWebhook(parsed.data);
  const executive = getExecutiveProfileBySlug(parsed.data.executiveSlug);
  const callWorkflow = runSimulatedInboundCallWorkflow({
    callerEmail: parsed.data.callerEmail,
    callerName: parsed.data.callerName,
    callerPhone: parsed.data.callerPhone,
    consent: true,
    detectedDialect: parsed.data.dialect ?? null,
    executiveName: executive?.displayName ?? parsed.data.executiveSlug,
    executiveSlug: parsed.data.executiveSlug,
    preferredLanguage: parsed.data.preferredLanguage ?? null,
    transcript: receptionistRequest.message
  });
  const result = await processReceptionistWorkflowRequest({
    executiveSlug: parsed.data.executiveSlug,
    rateLimitKey: `${parsed.data.executiveSlug}:${parsed.data.callerPhone}`,
    request: receptionistRequest,
    sessionId: parsed.data.sessionId ?? null,
    source: "inbound_call"
  });

  return NextResponse.json(
    {
      ...result,
      callWorkflow: {
        actionTaken: callWorkflow.callEvent.actionTaken,
        followUpRequired: callWorkflow.callEvent.followUpRequired,
        intent: callWorkflow.callEvent.intent,
        providerStatus: callWorkflow.providerStatus,
        trustScore: callWorkflow.callEvent.trustScore,
        urgencyScore: callWorkflow.callEvent.urgencyScore
      }
    },
    { status: result.statusCode }
  );
}
