type EnvironmentMap = Record<string, string | undefined>;

export type IdentityEnvironment = {
  readonly applicationBaseUrl: string;
  readonly allowedAudience: string;
  readonly allowedRedirectOrigins: readonly string[];
  readonly callbackUrl: string;
  readonly clockSkewSeconds: number;
  readonly cookieDomain?: string | undefined;
  readonly cookieSecure: boolean;
  readonly developmentMode: boolean;
  readonly idleTimeoutSeconds: number;
  readonly transactionEncryptionKey: string;
  readonly absoluteTimeoutSeconds: number;
  readonly workosApiKey: string;
  readonly workosClientId: string;
  readonly workosIssuer: string;
  readonly workosJwksUrl: string;
  readonly workosWebhookSecret: string;
};

export type IdentityEnvironmentResult =
  | { readonly configured: true; readonly value: IdentityEnvironment }
  | { readonly configured: false; readonly errors: readonly string[] };

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function safeOrigins(value: string | undefined, applicationBaseUrl: string): readonly string[] {
  const configured = (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : [new URL(applicationBaseUrl).origin];
}

export function readIdentityEnvironment(
  env: EnvironmentMap = process.env
): IdentityEnvironmentResult {
  const errors: string[] = [];
  const applicationBaseUrl = env.DASHBOARD_BASE_URL ?? env.APP_BASE_URL ?? "";
  const workosClientId = env.WORKOS_CLIENT_ID ?? "";
  const workosApiKey = env.WORKOS_API_KEY ?? "";
  const workosWebhookSecret = env.WORKOS_WEBHOOK_SECRET ?? "";
  const callbackUrl = env.WORKOS_REDIRECT_URI ?? "";
  const transactionEncryptionKey = env.IDENTITY_TRANSACTION_ENCRYPTION_KEY ?? "";

  for (const [name, value] of [
    ["DASHBOARD_BASE_URL or APP_BASE_URL", applicationBaseUrl],
    ["WORKOS_CLIENT_ID", workosClientId],
    ["WORKOS_API_KEY", workosApiKey],
    ["WORKOS_WEBHOOK_SECRET", workosWebhookSecret],
    ["WORKOS_REDIRECT_URI", callbackUrl],
    ["IDENTITY_TRANSACTION_ENCRYPTION_KEY", transactionEncryptionKey]
  ] as const) {
    if (!value) errors.push(`${name} is required.`);
  }

  try {
    if (applicationBaseUrl) new URL(applicationBaseUrl);
    if (callbackUrl) new URL(callbackUrl);
  } catch {
    errors.push("Identity URLs must be valid absolute URLs.");
  }

  if (errors.length > 0) {
    return { configured: false, errors };
  }

  const issuer = env.WORKOS_ISSUER ?? "https://api.workos.com/";

  return {
    configured: true,
    value: {
      absoluteTimeoutSeconds: positiveInteger(env.IDENTITY_SESSION_ABSOLUTE_SECONDS, 28_800),
      allowedAudience: env.IDENTITY_ALLOWED_AUDIENCE ?? workosClientId,
      allowedRedirectOrigins: safeOrigins(env.IDENTITY_ALLOWED_REDIRECT_ORIGINS, applicationBaseUrl),
      applicationBaseUrl,
      callbackUrl,
      clockSkewSeconds: positiveInteger(env.IDENTITY_CLOCK_SKEW_SECONDS, 60),
      ...(env.IDENTITY_COOKIE_DOMAIN ? { cookieDomain: env.IDENTITY_COOKIE_DOMAIN } : {}),
      cookieSecure: env.NODE_ENV === "production" || env.IDENTITY_SECURE_COOKIES === "true",
      developmentMode: env.IDENTITY_DEVELOPMENT_MODE === "true" && env.NODE_ENV !== "production",
      idleTimeoutSeconds: positiveInteger(env.IDENTITY_SESSION_IDLE_SECONDS, 1_800),
      transactionEncryptionKey,
      workosApiKey,
      workosClientId,
      workosIssuer: issuer,
      workosJwksUrl:
        env.WORKOS_JWKS_URL ??
        `https://api.workos.com/sso/jwks/${encodeURIComponent(workosClientId)}`,
      workosWebhookSecret
    }
  };
}

export function isAllowedReturnTo(
  value: string | null | undefined,
  environment: Pick<IdentityEnvironment, "applicationBaseUrl" | "allowedRedirectOrigins">
): boolean {
  if (!value) return false;

  try {
    const url = new URL(value, environment.applicationBaseUrl);
    return environment.allowedRedirectOrigins.includes(url.origin);
  } catch {
    return false;
  }
}

export function assertDevelopmentIdentityAllowed(
  env: EnvironmentMap = process.env
): void {
  if (env.IDENTITY_DEVELOPMENT_MODE !== "true") {
    throw new Error("Development identity mode is not enabled.");
  }
  if (env.NODE_ENV === "production") {
    throw new Error("Development identity mode is forbidden in production.");
  }
}
