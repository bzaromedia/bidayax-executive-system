import { NextResponse } from "next/server";
import { createLogger, validateEnvironmentConfig } from "@bidayax/config";

const log = createLogger({ component: "system-health-route" });

export async function GET() {
  const validation = validateEnvironmentConfig();
  const status = validation.status === "failed" ? "degraded" : "healthy";

  log("info", "health_check_completed", {
    status
  });

  return NextResponse.json({
    environment: validation.config.nodeEnv,
    service: "bidayax-dashboard",
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime())
  });
}

