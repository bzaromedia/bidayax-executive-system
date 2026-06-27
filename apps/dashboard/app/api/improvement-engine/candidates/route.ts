import { NextResponse } from "next/server";
import { getImprovementEngineDashboardData } from "@/data/improvement-queries";

export async function GET() {
  const data = await getImprovementEngineDashboardData();

  return NextResponse.json({
    candidates: data.candidates,
    status: data.status
  });
}
