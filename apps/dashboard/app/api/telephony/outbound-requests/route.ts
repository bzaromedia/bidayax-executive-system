import { NextResponse } from "next/server";
import { handleDashboardOutboundTelephonyRequest } from "../../../../src/lib/communications-telephony-gateway";

function logTelephonyRouteEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "dashboard-telephony-outbound-route",
      event,
      ...details
    })
  );
}

export async function POST() {
  const result = await handleDashboardOutboundTelephonyRequest();

  logTelephonyRouteEvent("warn", "execution_disabled", {
    reasonCode: result.reasonCodes[0] ?? null
  });

  return NextResponse.json(
    {
      error: result.error,
      ok: result.ok,
      reasonCodes: result.reasonCodes
    },
    { status: result.statusCode }
  );
}