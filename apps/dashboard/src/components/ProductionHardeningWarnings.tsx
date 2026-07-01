import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardLiveProviderReadinessData } from "../types/dashboard";
import { liveVoiceReasonLabels } from "../lib/live-provider-formatters";

type ProductionHardeningWarningsProps = {
  readonly liveProviderData: DashboardLiveProviderReadinessData;
  readonly databaseStatus: string;
};

export function ProductionHardeningWarnings({
  databaseStatus,
  liveProviderData
}: ProductionHardeningWarningsProps) {
  const warnings = [
    liveProviderData.summary.providerMode === "mock"
      ? "Telephony is in safety-gated future integration mode."
      : null,
    databaseStatus !== "ready"
      ? "Database readiness is degraded or not configured."
      : null,
    !liveProviderData.summary.allowProductionCalls
      ? "Production calls are disabled."
      : null,
    !liveProviderData.summary.outboundCallsEnabled
      ? "Outbound calls are disabled."
      : null,
    !liveProviderData.summary.voiceAgentEnabled
      ? "Voice agent is disabled."
      : null,
    liveProviderData.summary.voiceTestMode ? "Test mode is enabled." : null,
    !liveProviderData.summary.twilioConfigured
      ? "Twilio provider credentials are missing."
      : null,
    !liveProviderData.summary.openAiRealtimeConfigured
      ? "OpenAI Realtime configuration is missing."
      : null,
    ...liveProviderData.summary.blockedReasonCodes.map(
      (reason) => liveVoiceReasonLabels[reason]
    )
  ].filter((warning): warning is string => Boolean(warning));

  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Production hardening</Badge>
        <CardTitle>Production safety state</CardTitle>
        <CardDescription>
          Truthful deployment warnings for the current runtime configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {warnings.length === 0 ? (
            <Badge variant="accent">No production hardening warnings</Badge>
          ) : (
            warnings.map((warning) => (
              <Badge key={warning} variant="neutral">
                {warning}
              </Badge>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
