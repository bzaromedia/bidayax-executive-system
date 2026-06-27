export type RateLimitResult = {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function checkInMemoryRateLimit({
  key,
  limit,
  windowMs
}: {
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  const current =
    existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + windowMs
        };

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: current.count <= limit,
    remaining: Math.max(limit - current.count, 0),
    resetAt: new Date(current.resetAt).toISOString()
  };
}

