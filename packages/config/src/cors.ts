export function getAllowedOrigins(env: Record<string, string | undefined> = process.env) {
  return [
    env.APP_BASE_URL,
    env.CARD_BASE_URL,
    env.DASHBOARD_BASE_URL
  ].filter((origin): origin is string => Boolean(origin));
}

export function isOriginAllowed({
  env = process.env,
  origin
}: {
  readonly env?: Record<string, string | undefined>;
  readonly origin: string | null;
}) {
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins(env);

  return allowedOrigins.length === 0 || allowedOrigins.includes(origin);
}

