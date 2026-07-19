import { NextResponse } from "next/server";
import { handleDashboardInboundTelephonyWebhook } from "../../../../src/lib/communications-telephony-gateway";

function logTelephonyRouteEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "dashboard-telephony-inbound-route",
      event,
      ...details
    })
  );
}

export async function POST() {
  const result = await handleDashboardInboundTelephonyWebhook();

  logTelephonyRouteEvent("warn", "execution_disabled", {
    reasonCode: result.reasonCodes[0] ?? null
  });

  return NextResponse.json(
    {
      ok: result.ok,
      provider: result.provider,
      reasonCodes: result.reasonCodes,
      status: result.status
    },
    { status: result.statusCode }
  );
}