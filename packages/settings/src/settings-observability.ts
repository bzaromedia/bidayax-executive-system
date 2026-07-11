export const settingsMetricNames = [
  "settings_api_request",
  "settings_authorization_failure",
  "settings_publish_latency_ms",
  "settings_cache_hit",
  "settings_cache_miss",
  "settings_update"
] as const;

export type SettingsMetricName = (typeof settingsMetricNames)[number];

export type SettingsMetric = {
  readonly name: SettingsMetricName;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly value: number;
  readonly unit: "count" | "ms" | "ratio";
  readonly occurredAt: string;
  readonly tags: Record<string, string>;
};

export type SettingsLogEvent = {
  readonly event: string;
  readonly level: "info" | "warning" | "error";
  readonly message: string;
  readonly metadata: Record<string, string | number | boolean | null>;
  readonly occurredAt: string;
};

function sanitizeTags(tags: Record<string, string | number | boolean | null | undefined>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tags)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );
}

export function createSettingsMetric(input: {
  readonly cardId?: string | null | undefined;
  readonly name: SettingsMetricName;
  readonly occurredAt?: string | undefined;
  readonly tags?: Record<string, string | number | boolean | null | undefined> | undefined;
  readonly tenantId: string;
  readonly unit: SettingsMetric["unit"];
  readonly value: number;
}): SettingsMetric {
  return {
    cardId: input.cardId ?? null,
    name: input.name,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    tags: sanitizeTags(input.tags ?? {}),
    tenantId: input.tenantId,
    unit: input.unit,
    value: input.value
  };
}

export function createSettingsLogEvent(input: {
  readonly event: string;
  readonly level: SettingsLogEvent["level"];
  readonly message: string;
  readonly metadata?: Record<string, string | number | boolean | null | undefined> | undefined;
  readonly occurredAt?: string | undefined;
}): SettingsLogEvent {
  const metadata = Object.fromEntries(
    Object.entries(input.metadata ?? {}).filter(
      ([key, value]) => value !== undefined && !/secret|token|password|key/i.test(key)
    )
  ) as Record<string, string | number | boolean | null>;

  return {
    event: input.event,
    level: input.level,
    message: input.message,
    metadata,
    occurredAt: input.occurredAt ?? new Date().toISOString()
  };
}
