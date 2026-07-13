import type { TelephonyUsageCategory, TelephonyUsageLedgerEntry } from "@bidayax/types";

const categoryRatesCents = {
  appointment_request: 0,
  callback_attempt: 0,
  future_ai_runtime: 0,
  future_stt: 0,
  future_transcription: 0,
  future_tts: 0,
  provider_minutes: 0,
  recording_storage: 0
} as const satisfies Record<TelephonyUsageCategory, number>;

export function estimateTelephonyCostCents({
  category,
  quantity
}: {
  readonly category: TelephonyUsageCategory;
  readonly quantity: number;
}) {
  if (quantity < 0) {
    throw new Error("Telephony usage quantity cannot be negative.");
  }

  return Math.round(quantity * categoryRatesCents[category]);
}

export function createUsageLedgerEntry({
  cardId,
  category,
  ledgerEntryId,
  metadata = {},
  occurredAt,
  quantity,
  sessionId,
  tenantId,
  unit
}: Omit<TelephonyUsageLedgerEntry, "estimatedCostCents">): TelephonyUsageLedgerEntry {
  return {
    cardId: cardId ?? null,
    category,
    estimatedCostCents: estimateTelephonyCostCents({ category, quantity }),
    ledgerEntryId,
    metadata,
    occurredAt,
    quantity,
    sessionId: sessionId ?? null,
    tenantId,
    unit
  };
}
