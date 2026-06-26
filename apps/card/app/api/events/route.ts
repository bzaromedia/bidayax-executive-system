import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import { z } from "zod";
import { executiveSlugs, interactionEventTypes } from "@bidayax/types";

export const runtime = "nodejs";

const metadataValueSchema = z.union([
  z.string().max(512),
  z.number().finite(),
  z.boolean(),
  z.null()
]);

const eventRequestSchema = z
  .object({
    anonymousVisitorId: z.string().trim().min(8).max(128),
    eventType: z.enum(interactionEventTypes),
    executiveSlug: z.enum(executiveSlugs),
    metadata: z.record(z.string().min(1).max(64), metadataValueSchema).default({}),
    referrer: z.string().trim().url().max(2048).optional(),
    sessionId: z.string().trim().min(8).max(128),
    sourceUrl: z.string().trim().url().max(2048).optional()
  })
  .strict();

type EventRequest = z.infer<typeof eventRequestSchema>;

type DeviceInfo = {
  readonly deviceType: "desktop" | "mobile" | "tablet" | "bot" | "unknown";
  readonly browser: string;
  readonly os: string;
};

type InsertedEvent = {
  readonly id: string;
  readonly created_at: Date;
};

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
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  pool = new Pool(config);

  return pool;
}

function logLedgerEvent(
  level: "info" | "warn" | "error",
  event: string,
  details: Record<string, string | number | boolean | null> = {}
) {
  console[level](
    JSON.stringify({
      component: "qr-interaction-event-ledger",
      event,
      ...details
    })
  );
}

function parseUserAgent(userAgent: string | null): DeviceInfo {
  if (!userAgent) {
    return {
      browser: "unknown",
      deviceType: "unknown",
      os: "unknown"
    };
  }

  const normalized = userAgent.toLowerCase();
  const deviceType = /bot|crawler|spider|slurp/.test(normalized)
    ? "bot"
    : /ipad|tablet/.test(normalized)
      ? "tablet"
      : /mobile|iphone|android/.test(normalized)
        ? "mobile"
        : "desktop";
  const browser = /edg\//.test(normalized)
    ? "edge"
    : /chrome|crios/.test(normalized)
      ? "chrome"
      : /firefox|fxios/.test(normalized)
        ? "firefox"
        : /safari/.test(normalized)
          ? "safari"
          : "unknown";
  const os = /windows/.test(normalized)
    ? "windows"
    : /iphone|ipad|ios/.test(normalized)
      ? "ios"
      : /mac os|macintosh/.test(normalized)
        ? "macos"
        : /android/.test(normalized)
          ? "android"
          : /linux/.test(normalized)
            ? "linux"
            : "unknown";

  return {
    browser,
    deviceType,
    os
  };
}

function getClientIp(request: Request) {
  const headerNames = [
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
    "x-vercel-forwarded-for"
  ];

  for (const headerName of headerNames) {
    const value = request.headers.get(headerName);
    const firstValue = value?.split(",").at(0)?.trim();

    if (firstValue) {
      return firstValue;
    }
  }

  return null;
}

function hashIp(ipAddress: string | null) {
  if (!ipAddress) {
    return null;
  }

  const secret =
    process.env.BIDAYAX_IP_HASH_SECRET ??
    process.env.IP_HASH_SECRET ??
    "phase-4-development-ip-hash-secret";

  return createHmac("sha256", secret).update(ipAddress).digest("hex");
}

async function parseJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function storeEvent(event: EventRequest, request: Request) {
  const database = getDatabasePool();

  if (!database) {
    logLedgerEvent("error", "database_unavailable", {
      eventType: event.eventType,
      executiveSlug: event.executiveSlug
    });

    return null;
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const deviceInfo = parseUserAgent(userAgent);
  const ipHash = hashIp(getClientIp(request));

  const result = await database.query<InsertedEvent>(
    `
      insert into interaction_events (
        event_type,
        executive_slug,
        session_id,
        anonymous_visitor_id,
        source_url,
        referrer,
        user_agent,
        device_type,
        browser,
        os,
        ip_hash,
        metadata
      )
      values (
        $1::interaction_event_type,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12::jsonb
      )
      returning id, created_at
    `,
    [
      event.eventType,
      event.executiveSlug,
      event.sessionId,
      event.anonymousVisitorId,
      event.sourceUrl ?? null,
      event.referrer ?? null,
      userAgent,
      deviceInfo.deviceType,
      deviceInfo.browser,
      deviceInfo.os,
      ipHash,
      JSON.stringify(event.metadata)
    ]
  );

  return result.rows.at(0) ?? null;
}

export async function POST(request: Request) {
  const body = await parseJson(request);
  const parsed = eventRequestSchema.safeParse(body);

  if (!parsed.success) {
    logLedgerEvent("warn", "validation_failure", {
      issueCount: parsed.error.issues.length
    });

    return NextResponse.json(
      {
        error: "invalid_event",
        ok: false
      },
      { status: 400 }
    );
  }

  logLedgerEvent("info", "event_received", {
    eventType: parsed.data.eventType,
    executiveSlug: parsed.data.executiveSlug
  });

  try {
    const storedEvent = await storeEvent(parsed.data, request);

    if (!storedEvent) {
      return NextResponse.json(
        {
          error: "event_store_unavailable",
          ok: false
        },
        { status: 503 }
      );
    }

    logLedgerEvent("info", "database_success", {
      eventId: storedEvent.id,
      eventType: parsed.data.eventType,
      executiveSlug: parsed.data.executiveSlug
    });

    return NextResponse.json(
      {
        eventId: storedEvent.id,
        ok: true
      },
      { status: 201 }
    );
  } catch {
    logLedgerEvent("error", "database_failure", {
      eventType: parsed.data.eventType,
      executiveSlug: parsed.data.executiveSlug
    });

    return NextResponse.json(
      {
        error: "event_store_failed",
        ok: false
      },
      { status: 500 }
    );
  }
}
