import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardLiveProviderSummary } from "@bidayax/types";

type ProviderConfigurationChecklistProps = {
  readonly summary: DashboardLiveProviderSummary;
};

function checklistValue(value: boolean) {
  return value ? "Configured" : "Blocked";
}

export function ProviderConfigurationChecklist({
  summary
}: ProviderConfigurationChecklistProps) {
  const rows = [
    ["Twilio configuration", summary.twilioConfigured],
    ["OpenAI Realtime configuration", summary.openAiRealtimeConfigured],
    ["Live inbound enabled", summary.liveInboundCallsEnabled],
    ["Outbound enabled", summary.outboundCallsEnabled],
    ["Human approval required", summary.requireHumanApproval],
    ["Production calls allowed", summary.allowProductionCalls]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Configuration</Badge>
        <CardTitle>Provider configuration checklist</CardTitle>
        <CardDescription>
          Secrets are checked for presence only and are never displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <span className="text-sm text-content-secondary">{label}</span>
              <Badge variant={value ? "accent" : "neutral"}>
                {checklistValue(value)}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

