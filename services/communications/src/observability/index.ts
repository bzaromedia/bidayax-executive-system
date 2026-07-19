export const communicationsObservabilityMetrics = [
  "communications.commands.requested",
  "communications.commands.authorized",
  "communications.commands.blocked",
  "communications.dispatch.attempted",
  "communications.dispatch.failed",
  "communications.adapter.degraded",
  "communications.adapter.recovered",
  "communications.kill_switch.applied"
] as const;

export type CommunicationsTraceContext = {
  readonly traceId: string;
  readonly correlationId: string;
  readonly tenantId: string;
  readonly cardId: string | null;
  readonly communicationId: string | null;
};
