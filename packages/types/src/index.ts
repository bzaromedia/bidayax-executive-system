export type Phase = "phase-1" | "phase-2" | "future";

export type EvidenceMetric = {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly source: string;
};
