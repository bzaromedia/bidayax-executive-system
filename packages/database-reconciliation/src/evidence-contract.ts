import type { OperationEvidenceRecord } from "./types.ts";

export function createOperationEvidenceRecord(
  partial: Omit<OperationEvidenceRecord, "timestampUtc">
): OperationEvidenceRecord {
  return {
    ...partial,
    timestampUtc: new Date().toISOString()
  };
}
