type RateLimitInput = {
  readonly key: string;
  readonly limit?: number;
  readonly windowMs?: number;
  readonly now?: number;
};

type RateLimitBucket = {
  readonly resetAt: number;
  readonly timestamps: readonly number[];
};

const buckets = new Map<string, RateLimitBucket>();

export function resetReceptionistRateLimitPolicy() {
  buckets.clear();
}

export function evaluateReceptionistRateLimit(input: RateLimitInput) {
  const limit = input.limit ?? 5;
  const windowMs = input.windowMs ?? 10 * 60 * 1000;
  const now = input.now ?? Date.now();
  const existing = buckets.get(input.key);
  const timestamps = (existing?.timestamps ?? []).filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (timestamps.length >= limit) {
    const firstTimestamp = timestamps[0] ?? now;
    const resetAt = firstTimestamp + windowMs;

    buckets.set(input.key, {
      resetAt,
      timestamps
    });

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      reasonCode: "rate_limit_exceeded"
    } as const;
  }

  const nextTimestamps = [...timestamps, now];
  buckets.set(input.key, {
    resetAt: now + windowMs,
    timestamps: nextTimestamps
  });

  return {
    allowed: true,
    remaining: Math.max(0, limit - nextTimestamps.length),
    resetAt: now + windowMs,
    reasonCode: null
  } as const;
}

