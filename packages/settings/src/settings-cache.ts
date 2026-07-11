export type SettingsCacheKind = "published-card" | "brand-tokens" | "version-history";

export type SettingsCacheEntry<TValue> = {
  readonly expiresAt: number;
  readonly key: string;
  readonly tenantId: string;
  readonly value: TValue;
};

export type SettingsCacheMetrics = {
  readonly hits: number;
  readonly misses: number;
  readonly writes: number;
  readonly invalidations: number;
};

export type SettingsCache = {
  readonly get: <TValue>(key: string) => TValue | null;
  readonly metrics: () => SettingsCacheMetrics;
  readonly set: <TValue>(entry: SettingsCacheEntry<TValue>) => void;
  readonly invalidateTenant: (tenantId: string) => number;
  readonly invalidateCard: (tenantId: string, cardId: string) => number;
};

export function createSettingsCache(): SettingsCache {
  const entries = new Map<string, SettingsCacheEntry<unknown>>();
  let hits = 0;
  let misses = 0;
  let writes = 0;
  let invalidations = 0;

  return {
    get<TValue>(key: string): TValue | null {
      const entry = entries.get(key);

      if (!entry || entry.expiresAt <= Date.now()) {
        misses += 1;
        entries.delete(key);
        return null;
      }

      hits += 1;
      return entry.value as TValue;
    },
    invalidateCard(tenantId: string, cardId: string): number {
      let removed = 0;
      const prefix = `${tenantId}:${cardId}:`;

      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) {
          entries.delete(key);
          removed += 1;
        }
      }

      invalidations += removed;
      return removed;
    },
    invalidateTenant(tenantId: string): number {
      let removed = 0;
      const prefix = `${tenantId}:`;

      for (const key of entries.keys()) {
        if (key.startsWith(prefix)) {
          entries.delete(key);
          removed += 1;
        }
      }

      invalidations += removed;
      return removed;
    },
    metrics(): SettingsCacheMetrics {
      return {
        hits,
        invalidations,
        misses,
        writes
      };
    },
    set<TValue>(entry: SettingsCacheEntry<TValue>): void {
      entries.set(entry.key, entry);
      writes += 1;
    }
  };
}

export function makeSettingsCacheKey(input: {
  readonly cardId: string;
  readonly kind: SettingsCacheKind;
  readonly tenantId: string;
  readonly version?: string | null | undefined;
}): string {
  const version = input.version ?? "current";
  return `${input.tenantId}:${input.cardId}:${input.kind}:${version}`;
}

export function createSettingsCacheEntry<TValue>(input: {
  readonly key: string;
  readonly tenantId: string;
  readonly ttlMs: number;
  readonly value: TValue;
}): SettingsCacheEntry<TValue> {
  return {
    expiresAt: Date.now() + input.ttlMs,
    key: input.key,
    tenantId: input.tenantId,
    value: input.value
  };
}
