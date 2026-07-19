export const communicationWorkerModes = [
  "sandbox_dispatch_only",
  "policy_only",
  "disabled"
] as const;

export type CommunicationWorkerMode = (typeof communicationWorkerModes)[number];

export interface CommunicationWorkerSupervisor {
  readonly mode: CommunicationWorkerMode;
  shutdown(): Promise<void>;
}
