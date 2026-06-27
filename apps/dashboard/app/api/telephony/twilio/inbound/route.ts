import { NextResponse } from "next/server";
import { Pool } from "pg";
import type { PoolConfig } from "pg";
import {
  generateSafeTwimlResponse,
  getLiveProviderRuntimeConfig,
  TwilioProvider,
  validateTwilioWebhookSignature
} from "@bidayax/telephony";

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

function requestHeadersToRecord(headers: Headers) {
  const record: Record<string, string> = {};

  headers.forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

export async function POST(request: Request) {
  const config = getLiveProviderRuntimeConfig();
  const database = getDatabasePool();
  const url = request.url;

  logTwilioRouteEvent("info", "webhook_received");

  try {
    const rawBody = await request.text();
    const formData = new URLSearchParams(rawBody);
    const payload = Object.fromEntries(formData.entries());
    const validation = validateTwilioWebhookSignature({
      authToken: config.twilioAuthToken,
      headers: requestHeadersToRecord(request.headers),
      params: payload,
      productionMode: !config.voiceTestMode,
      rawBody,
      signingEnabled: config.twilioWebhookSigningEnabled,
      url
    });

    if (!validation.valid) {
      logTwilioRouteEvent("warn", "webhook_rejected", {
        reasonCount: validation.reasonCodes.length
      });

      return new NextResponse(
        generateSafeTwimlResponse({
          message: "BidayaX reception could not validate this call. Goodbye.",
          testMode: config.voiceTestMode
        }),
        {
          headers: { "content-type": "text/xml" },
          status: 403
        }
      );
    }

    const normalized = new TwilioProvider().normalizeInboundWebhook(payload);

    if (database) {
      const callResult = await database.query<{ readonly id: string }>(
        `
          insert into telephony_calls (
            provider,
            provider_call_id,
            direction,
            from_number,
            to_number,
            executive_slug,
            status,
            language,
            dialect
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          returning id::text
        `,
        [
          normalized.provider,
          normalized.providerCallId,
          normalized.direction,
          normalized.fromNumber,
          normalized.toNumber,
          normalized.executiveSlug,
          normalized.status,
          normalized.language,
          normalized.dialect
        ]
      );
      const callId = callResult.rows[0]?.id;

      if (callId) {
        await database.query(
          `
            insert into telephony_call_events (call_id, event_type, payload)
            values ($1::uuid, $2, $3::jsonb), ($1::uuid, $4, $5::jsonb)
          `,
          [
            callId,
            "call_received",
            JSON.stringify({ provider: "twilio" }),
            "call_validated",
            JSON.stringify({ signatureChecked: validation.signingChecked })
          ]
        );
      }
    }

    logTwilioRouteEvent("info", "twiml_response_generated", {
      testMode: config.voiceTestMode
    });

    return new NextResponse(
      generateSafeTwimlResponse({
        gatherDigits: config.voiceTestMode,
        testMode: config.voiceTestMode
      }),
      {
        headers: { "content-type": "text/xml" },
        status: 200
      }
    );
  } catch {
    logTwilioRouteEvent("warn", "webhook_rejected", {
      reason: "malformed_provider_payload"
    });

    return new NextResponse(
      generateSafeTwimlResponse({
        message: "BidayaX reception received an invalid call payload. Goodbye.",
        testMode: config.voiceTestMode
      }),
      {
        headers: { "content-type": "text/xml" },
        status: 400
      }
    );
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
