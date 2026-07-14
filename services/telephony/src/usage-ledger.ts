import type { TelephonyUsageCategory, TelephonyUsageLedgerEntry } from "@bidayax/types";

const categoryRatesCents = {
  adjustment: 0,
  appointment_request: 0,
  callback_attempt: 0,
  credit: 0,
  future_ai_runtime: 0,
  future_stt: 0,
  future_transcription: 0,
  future_tts: 0,
  inbound_minutes: 0,
  messaging: 0,
  outbound_minutes: 0,
  provider_minutes: 0,
  recording_storage: 0,
  tax_or_fee: 0,
  transcript_storage: 0
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
  amountCents,
  cardId,
  category,
  correlationId,
  currency,
  estimatedCostCents,
  ledgerEntryId,
  metadata = {},
  occurredAt,
  providerReference,
  quantity,
  reversalOfLedgerEntryId,
  sessionId,
  source,
  tenantId,
  unit,
  unitCostCents
}: Omit<TelephonyUsageLedgerEntry, "amountCents" | "estimatedCostCents" | "currency" | "unitCostCents" | "source" | "correlationId"> &
  Partial<Pick<TelephonyUsageLedgerEntry, "amountCents" | "estimatedCostCents" | "currency" | "unitCostCents" | "source" | "correlationId">>): TelephonyUsageLedgerEntry {
  const computedAmountCents = amountCents ?? estimateTelephonyCostCents({ category, quantity });

  if (computedAmountCents < 0 && !reversalOfLedgerEntryId) {
    throw new Error("Negative telephony ledger entries require a reversal reference.");
  }

  return {
    amountCents: computedAmountCents,
    cardId: cardId ?? null,
    category,
    correlationId: correlationId ?? ledgerEntryId,
    currency: currency ?? "USD",
    estimatedCostCents:
      estimatedCostCents ?? estimateTelephonyCostCents({ category, quantity }),
    ledgerEntryId,
    metadata,
    occurredAt,
    providerReference: providerReference ?? null,
    quantity,
    reversalOfLedgerEntryId: reversalOfLedgerEntryId ?? null,
    sessionId: sessionId ?? null,
    source: source ?? "control_plane",
    tenantId,
    unit,
    unitCostCents: unitCostCents ?? categoryRatesCents[category]
  };
}
