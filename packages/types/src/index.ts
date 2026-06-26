export * from "./events";

export type Phase = "phase-1" | "phase-2" | "phase-3" | "phase-4" | "future";

export type EvidenceMetric = {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly source: string;
};
