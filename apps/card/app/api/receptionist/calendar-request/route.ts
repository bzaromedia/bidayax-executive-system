import { NextResponse } from "next/server";
import { z } from "zod";
import { executiveSlugs, receptionistLanguages, type ReceptionistRequest } from "@bidayax/types";
import { processReceptionistWorkflowRequest } from "@/lib/receptionist-server-workflow";

export const runtime = "nodejs";

const calendarSchema = z
  .object({
    company: z.string().trim().min(1).max(160).optional(),
    consent: z.literal(true),
    dialect: z.string().trim().min(1).max(80).optional(),
    email: z.string().trim().email().max(254),
    executiveSlug: z.enum(executiveSlugs),
    message: z.string().trim().min(10).max(2000),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(7).max(40).optional(),
    preferredLanguage: z.enum(receptionistLanguages),
    preferredTime: z.string().trim().min(1).max(160),
    sessionId: z.string().trim().min(8).max(128).optional()
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
  const parsed = calendarSchema.safeParse(await parseJson(request));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_calendar_request", providerStatus: "invalid", success: false },
      { status: 400 }
    );
  }

  const receptionistRequest: ReceptionistRequest = {
    consent: true,
    email: parsed.data.email,
    executiveSlug: parsed.data.executiveSlug,
    message: parsed.data.message,
    name: parsed.data.name,
    preferredLanguage: parsed.data.preferredLanguage,
    preferredTime: parsed.data.preferredTime,
    requestType: "schedule_meeting",
    ...(parsed.data.company ? { company: parsed.data.company } : {}),
    ...(parsed.data.dialect ? { dialect: parsed.data.dialect } : {}),
    ...(parsed.data.phone ? { phone: parsed.data.phone } : {})
  };
  const result = await processReceptionistWorkflowRequest({
    executiveSlug: parsed.data.executiveSlug,
    rateLimitKey: `${parsed.data.executiveSlug}:${parsed.data.email.toLowerCase()}:calendar`,
    request: receptionistRequest,
    sessionId: parsed.data.sessionId ?? null,
    source: "calendar_request"
  });

  return NextResponse.json(result, { status: result.statusCode });
}
