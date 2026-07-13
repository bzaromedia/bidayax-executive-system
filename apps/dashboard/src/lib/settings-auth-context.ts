import type {
  SettingsAuthorizationContext,
  SettingsPermission
} from "@bidayax/settings";
import {
  identityCsrfCookieName,
  parseCookie,
  verifyCsrf
} from "@bidayax/identity";
import {
  getIdentityEnvironment,
  resolveDashboardIdentity
} from "./identity-runtime";

export type TrustedSettingsAuthResult =
  | {
      readonly context: SettingsAuthorizationContext;
      readonly ok: true;
      readonly source: "identity_application_session" | "explicit_development_simulation";
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly status: 401 | 403 | 503;
    };

export async function readTrustedSettingsAuthContext(input: {
  readonly request: Request;
  readonly resourceCardId: string;
  readonly resourceTenantId: string;
}): Promise<TrustedSettingsAuthResult> {
  const resolved = await resolveDashboardIdentity(input);
  if (!resolved.ok) return resolved;

  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(input.request.method);
  if (unsafeMethod && resolved.repository) {
    const environment = getIdentityEnvironment();
    const origin = input.request.headers.get("origin");
    if (!environment || !origin || !environment.allowedRedirectOrigins.includes(origin)) {
      return {
        ok: false,
        reason: "Settings request origin validation failed.",
        status: 403
      };
    }
    const csrfValid = await verifyCsrf({
      csrfCookie: parseCookie(
        input.request.headers.get("cookie"),
        identityCsrfCookieName
      ),
      csrfHeader: input.request.headers.get("x-csrf-token"),
      repository: resolved.repository,
      sessionId: resolved.context.sessionId
    });
    if (!csrfValid) {
      return {
        ok: false,
        reason: "Settings request CSRF validation failed.",
        status: 403
      };
    }
  }
  const identity = resolved.context;
  return {
    context: {
      actorId: identity.userId,
      cardIds: identity.permittedCardIds,
      displayName: identity.auditActor.displayName,
      permissions: identity.permissions.filter((permission): permission is SettingsPermission =>
        permission.startsWith("settings:") ||
        permission === "receptionist:configure" ||
        permission === "audit:read" ||
        permission === "members:manage" ||
        permission === "sessions:revoke" ||
        permission === "card-access:manage"
      ),
      role: identity.role,
      tenantId: identity.tenantId
    },
    ok: true,
    source:
      identity.authenticationMethod === "explicit_development_simulation"
        ? "explicit_development_simulation"
        : "identity_application_session"
  };
}
