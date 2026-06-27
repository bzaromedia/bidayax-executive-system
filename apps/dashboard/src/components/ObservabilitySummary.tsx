import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Grid } from "@bidayax/ui";
import type { DashboardObservabilitySummary } from "@bidayax/types";
import { formatInteger } from "../lib/formatters";

type ObservabilitySummaryProps = {
  readonly summary: DashboardObservabilitySummary;
};

export function ObservabilitySummary({ summary }: ObservabilitySummaryProps) {
  const rows = [
    ["Telemetry events", summary.eventCount],
    ["Metrics", summary.metricCount],
    ["Errors", summary.errorCount],
    ["Safety gate decisions", summary.safetyGateEventCount],
    ["Blocked gates", summary.blockedSafetyGateCount],
    ["Subsystems measured", summary.subsystemCount]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Observability</Badge>
        <CardTitle>Telemetry summary</CardTitle>
        <CardDescription>
          Database-backed measurement across system behavior, safety gates,
          errors, and performance signals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Grid columns={3} gap={3}>
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <p className="text-xs uppercase tracking-wide text-content-muted">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold text-content-primary">
                {formatInteger(value)}
              </p>
            </div>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

