import type { CustomizationAuditEvent } from "@bidayax/types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

export function hashSettingsValue(value: unknown) {
  const serialized = stableStringify(value);
  let hash = 5381;

  for (let index = 0; index < serialized.length; index += 1) {
    hash = (hash * 33) ^ serialized.charCodeAt(index);
  }

  return `hash_${(hash >>> 0).toString(36)}`;
}

export function createCustomizationAuditEvent(input: {
  readonly actor: string;
  readonly affectedCard: string;
  readonly newValue: unknown;
  readonly oldValue: unknown;
  readonly settingType: string;
  readonly timestamp?: string;
}): CustomizationAuditEvent {
  const timestamp = input.timestamp ?? new Date().toISOString();

  return {
    actor: input.actor,
    affectedCard: input.affectedCard,
    auditEventId: `audit_${input.affectedCard}_${input.settingType}_${hashSettingsValue({
      actor: input.actor,
      newValue: input.newValue,
      oldValue: input.oldValue,
      timestamp
    })}`,
    newValueHash: hashSettingsValue(input.newValue),
    oldValueHash: hashSettingsValue(input.oldValue),
    settingType: input.settingType,
    timestamp
  };
}
