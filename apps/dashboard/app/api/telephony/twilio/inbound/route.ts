import { NextResponse } from "next/server";
import {
  createMalformedTwilioInboundResponse,
  handleDashboardTwilioInboundTelephonyWebhook
} from "../../../../../src/lib/communications-telephony-gateway";

function logTwilioRouteEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "twilio-inbound-route",
      event,
      ...details
    })
  );
}

export async function POST() {
  try {
    const result = await handleDashboardTwilioInboundTelephonyWebhook();

    logTwilioRouteEvent("warn", "execution_disabled", {
      reasonCode: result.validation.reasonCodes[0] ?? null
    });

    return new NextResponse(result.twiml, {
      headers: { "content-type": "text/xml" },
      status: result.statusCode
    });
  } catch {
    logTwilioRouteEvent("warn", "webhook_rejected", {
      reason: "malformed_provider_payload"
    });

    const malformed = createMalformedTwilioInboundResponse();

    return new NextResponse(malformed.twiml, {
      headers: { "content-type": "text/xml" },
      status: malformed.statusCode
    });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Twilio inbound webhooks must use POST."
    },
    { status: 405 }
  );
}