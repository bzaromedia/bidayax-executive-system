export * from "./events";
export * from "./intent";
export * from "./graph";
export * from "./improvement";
export * from "./receptionist";
export * from "./telephony";
export * from "./live-provider";
export * from "./telemetry";
export * from "./dashboard";
export * from "./card-customization";
export * from "./settings";
export * from "./audit-events";
export * from "./card-profile";
export * from "./branding";
export * from "./resolved-brand-tokens";
export * from "./data-trust";
export * from "./policy-enforcement";

export type Phase =
  | "phase-1"
  | "phase-2"
  | "phase-3"
  | "phase-4"
  | "phase-5"
  | "phase-6"
  | "phase-7"
  | "phase-8"
  | "phase-9"
  | "phase-10"
  | "phase-11"
  | "phase-12"
  | "phase-13"
  | "future";

export type EvidenceMetric = {
  readonly name: string;
  readonly value: number;
  readonly unit: string;
  readonly source: string;
};
