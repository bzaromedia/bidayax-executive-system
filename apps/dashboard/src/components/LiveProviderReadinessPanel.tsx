import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardLiveProviderReadinessData } from "../types/dashboard";
import {
  formatProviderMode,
  providerReadinessStatusLabels
} from "../lib/live-provider-formatters";

type LiveProviderReadinessPanelProps = {
  readonly data: DashboardLiveProviderReadinessData;
};

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function LiveProviderReadinessPanel({
  data
}: LiveProviderReadinessPanelProps) {
  const summaryRows = [
    ["Provider mode", formatProviderMode(data.summary.providerMode)],
    ["Twilio configured", yesNo(data.summary.twilioConfigured)],
    ["OpenAI Realtime configured", yesNo(data.summary.openAiRealtimeConfigured)],
    ["Production voice allowed", yesNo(data.summary.productionVoiceAllowed)]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Phase 10</Badge>
        <CardTitle>Live provider readiness</CardTitle>
        <CardDescription>
          Safety-gated provider integration status. This panel does not claim live
          production readiness unless every gate passes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-4">
          {summaryRows.map(([label, value]) => (
            <div
              key={label}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <p className="text-xs uppercase tracking-wide text-content-muted">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-content-primary">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {data.readinessChecks.map((check) => (
            <div
              key={`${check.provider}-${check.checkName}`}
              className="rounded-bxMd border border-border-subtle bg-surface-inset p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-content-primary">
                  {check.checkName.replaceAll("_", " ")}
                </p>
                <Badge
                  variant={check.status === "passed" ? "accent" : "neutral"}
                >
                  {providerReadinessStatusLabels[check.status]}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-content-secondary">
                {check.details}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

