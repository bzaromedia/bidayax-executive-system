export * from "./events";
export * from "./intent";
export * from "./graph";
export * from "./dashboard";

export type Phase =
  | "phase-1"
  | "phase-2"
  | "phase-3"
  | "phase-4"
  | "phase-5"
  | "phase-6"
  | "phase-7"
  | "future";

export type EvidenceMetric = {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly source: string;
};
