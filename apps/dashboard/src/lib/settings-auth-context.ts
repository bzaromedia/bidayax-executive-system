import { Buffer } from "node:buffer";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  createSettingsAuthorizationContextFromClaims,
  validateTrustedSettingsAuthClaims,
  type SettingsAuthorizationContext,
  type TrustedSettingsAuthClaims
} from "@bidayax/settings";

export const settingsSessionCookieName = "bidayax_settings_session";

type TrustedSettingsAuthResult =
  | {
      readonly context: SettingsAuthorizationContext;
      readonly ok: true;
      readonly source: "signed_cookie" | "bearer_token" | "local_development_fallback";
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly status: 401 | 403;
    };

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(";")) {
    const [cookieName, ...valueParts] = entry.trim().split("=");

    if (cookieName === name) {
      return valueParts.join("=") || null;
    }
  }

  return null;
}

function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

function verifyToken(token: string, secret: string): unknown | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(payload, secret);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(payload)) as unknown;
  } catch {
    return null;
  }
}

function createLocalDevelopmentContext(input: {
  readonly resourceCardId: string;
  readonly resourceTenantId: string;
  readonly request: Request;
}): SettingsAuthorizationContext {
  return {
    actorId: "local-dashboard-settings",
    cardIds: [input.resourceCardId],
    displayName: "Local Dashboard Settings",
    ipAddress: input.request.headers.get("x-forwarded-for") ?? undefined,
    role: "administrator",
    tenantId: input.resourceTenantId,
    userAgent: input.request.headers.get("user-agent") ?? undefined
  };
}

export function createTrustedSettingsAuthToken(input: {
  readonly claims: TrustedSettingsAuthClaims;
  readonly secret: string;
}): string {
  const payload = base64UrlEncode(JSON.stringify(input.claims));
  return `${payload}.${signPayload(payload, input.secret)}`;
}

export function readTrustedSettingsAuthContext(input: {
  readonly request: Request;
  readonly resourceCardId: string;
  readonly resourceTenantId: string;
}): TrustedSettingsAuthResult {
  const secret = process.env.SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        reason: "SETTINGS_AUTH_TRUSTED_CONTEXT_SECRET is required for production settings routes.",
        status: 401
      };
    }

    return {
      context: createLocalDevelopmentContext(input),
      ok: true,
      source: "local_development_fallback"
    };
  }

  const cookieToken = readCookie(input.request, settingsSessionCookieName);
  const bearerToken = readBearerToken(input.request);
  const token = cookieToken ?? bearerToken;

  if (!token) {
    return {
      ok: false,
      reason: "Trusted settings session token is required.",
      status: 401
    };
  }

  const payload = verifyToken(token, secret);

  if (!payload) {
    return {
      ok: false,
      reason: "Trusted settings session token is invalid.",
      status: 401
    };
  }

  const validation = validateTrustedSettingsAuthClaims({
    payload,
    resourceCardId: input.resourceCardId,
    resourceTenantId: input.resourceTenantId
  });

  if (!validation.ok) {
    return {
      ok: false,
      reason: validation.reason,
      status: 403
    };
  }

  return {
    context: createSettingsAuthorizationContextFromClaims({
      claims: validation.claims,
      ipAddress: input.request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: input.request.headers.get("user-agent") ?? undefined
    }),
    ok: true,
    source: cookieToken ? "signed_cookie" : "bearer_token"
  };
}
