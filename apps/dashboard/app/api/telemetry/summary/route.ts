import { NextResponse } from "next/server";
import { getObservabilityDashboardData } from "@/data/telemetry-queries";

export async function GET() {
  const data = await getObservabilityDashboardData();

  return NextResponse.json({
    status: data.status,
    summary: data.summary
  });
}

