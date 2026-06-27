import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardTelephonyReadinessSummary } from "../types/dashboard";
import { formatInteger } from "../lib/formatters";
import { telephonyProviderLabels } from "../lib/telephony-formatters";

type TelephonyReadinessSummaryProps = {
  readonly summary: DashboardTelephonyReadinessSummary;
};

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export function TelephonyReadinessSummary({
  summary
}: TelephonyReadinessSummaryProps) {
  const rows = [
    ["Provider", telephonyProviderLabels[summary.provider]],
    ["Provider configured", yesNo(summary.providerConfigured)],
    ["Outbound calls enabled", yesNo(summary.outboundCallsEnabled)],
    ["Voice agent enabled", yesNo(summary.voiceAgentEnabled)],
    ["Human approval required", yesNo(summary.requireHumanApproval)],
    ["Calls", formatInteger(summary.callCount)],
    ["Voice sessions", formatInteger(summary.voiceSessionCount)],
    ["Pending approvals", formatInteger(summary.pendingApprovalCount)]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Telephony</Badge>
        <CardTitle>Telephony readiness summary</CardTitle>
        <CardDescription>
          Prepared for live integration. Mock provider, disabled outbound calls,
          disabled voice agent, and human approval are the safe defaults.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map(([label, value]) => (
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
      </CardContent>
    </Card>
  );
}
