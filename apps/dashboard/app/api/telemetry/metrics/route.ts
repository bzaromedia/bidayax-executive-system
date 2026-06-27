import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  createTelemetryMetric,
  writeTelemetryMetric
} from "@bidayax/telemetry";
import { isTelemetrySubsystem } from "@bidayax/types";

let pool: Pool | null = null;

function getDatabasePool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  const config: PoolConfig = {
    connectionString,
    max: Number.parseInt(process.env.PG_POOL_MAX ?? "5", 10)
  };

  if (process.env.DATABASE_SSL === "true") {
    config.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(config);

  return pool;
}

export async function POST(request: Request) {
  const database = getDatabasePool();

  if (!database) {
    return NextResponse.json(
      {
        error: "Telemetry metric storage is not configured.",
        status: "degraded"
      },
      { status: 503 }
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const subsystem = typeof payload.subsystem === "string" ? payload.subsystem : "";

    if (
      typeof payload.metricName !== "string" ||
      typeof payload.metricValue !== "number" ||
      typeof payload.metricUnit !== "string" ||
      !isTelemetrySubsystem(subsystem)
    ) {
      return NextResponse.json(
        {
          error: "Invalid telemetry metric payload."
        },
        { status: 400 }
      );
    }

    const metric = createTelemetryMetric({
      dimensions:
        payload.dimensions && typeof payload.dimensions === "object"
          ? (payload.dimensions as Record<string, unknown>)
          : {},
      metricName: payload.metricName,
      metricUnit: payload.metricUnit,
      metricValue: payload.metricValue,
      subsystem
    });

    await writeTelemetryMetric(database, metric);

    return NextResponse.json({
      ok: true
    });
  } catch {
    return NextResponse.json(
      {
        error: "Telemetry metric could not be stored safely."
      },
      { status: 500 }
    );
  }
}

