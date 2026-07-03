import { NextResponse } from "next/server";
import { z } from "zod";
import { createCustomerCardSettingsFromExecutiveProfile } from "@bidayax/card-customization";
import { getExecutiveProfileBySlug } from "@bidayax/config/executives";
import {
  executiveSlugs,
  receptionistLanguages,
  receptionistRequestTypes,
  type ReceptionistRequest
} from "@bidayax/types";
import { storeReceptionistRequest } from "@/lib/receptionist-events";
import {
  createReceptionistNotificationPayload,
  getReceptionistNotificationStatus
} from "@/lib/receptionist-notification";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
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

  const executive = getExecutiveProfileBySlug(parsed.data.executiveSlug);

  if (!executive) {
    return NextResponse.json(
      {
        error: "invalid_executive",
        providerStatus: "invalid",
        success: false
      },
      { status: 404 }
    );
  }

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
  const settings = createCustomerCardSettingsFromExecutiveProfile(executive);
  const providerStatus = getReceptionistNotificationStatus();
  const notification = createReceptionistNotificationPayload(
    receptionistRequest,
    executive.displayName,
    settings.receptionist.handoffEmail
  );
  const stored = await storeReceptionistRequest({
    anonymousVisitorId: parsed.data.anonymousVisitorId ?? null,
    executiveSlug: parsed.data.executiveSlug,
    notification,
    providerStatus,
    request: receptionistRequest,
    sessionId: parsed.data.sessionId ?? null
  });

  return NextResponse.json(
    {
      providerStatus: stored.providerStatus,
      requestId: stored.requestId,
      success: true
    },
    { status: 202 }
  );
}
