import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import { getOrCreateCorrelationId } from "@bidayax/config";
import {
  createTelemetryError,
  createTelemetryEvent,
  writeTelemetryError,
  writeTelemetryEvent
} from "@bidayax/telemetry";
import {
  isTelemetryStatus,
  isTelemetrySubsystem,
  type TelemetryStatus
} from "@bidayax/types";

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
  const correlationId = getOrCreateCorrelationId(
    request.headers.get("x-bidayax-correlation-id")
  );

  if (!database) {
    return NextResponse.json(
      {
        error: "Telemetry storage is not configured.",
        status: "degraded"
      },
      { status: 503 }
    );
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const subsystem = typeof payload.subsystem === "string" ? payload.subsystem : "";
    const statusCandidate =
      typeof payload.status === "string" ? payload.status : "success";
    const status: TelemetryStatus = isTelemetryStatus(statusCandidate)
      ? statusCandidate
      : "success";

    if (
      typeof payload.eventName !== "string" ||
      !isTelemetrySubsystem(subsystem)
    ) {
      return NextResponse.json(
        {
          error: "Invalid telemetry event payload."
        },
        { status: 400 }
      );
    }

    const event = createTelemetryEvent({
      correlationId,
      durationMs:
        typeof payload.durationMs === "number" ? payload.durationMs : null,
      eventName: payload.eventName,
      metadata:
        payload.metadata && typeof payload.metadata === "object"
          ? (payload.metadata as Record<string, unknown>)
          : {},
      status,
      subsystem
    });

    await writeTelemetryEvent(database, event);

    return NextResponse.json({
      correlationId,
      ok: true
    });
  } catch {
    await writeTelemetryError(
      database,
      createTelemetryError({
        correlationId,
        errorCategory: "api",
        errorCode: "TELEMETRY_EVENT_INGESTION_FAILED",
        safeMessage: "Telemetry event ingestion failed safely.",
        subsystem: "system"
      })
    ).catch(() => undefined);

    return NextResponse.json(
      {
        error: "Telemetry event could not be stored safely."
      },
      { status: 500 }
    );
  }
}

