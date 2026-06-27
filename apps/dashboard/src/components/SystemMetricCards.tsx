import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Grid } from "@bidayax/ui";
import type { DashboardTelemetryMetric } from "@bidayax/types";
import {
  formatMetricValue,
  telemetrySubsystemLabels
} from "../lib/telemetry-formatters";

type SystemMetricCardsProps = {
  readonly metrics: readonly DashboardTelemetryMetric[];
};

export function SystemMetricCards({ metrics }: SystemMetricCardsProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Metrics</Badge>
        <CardTitle>System metric cards</CardTitle>
        <CardDescription>
          Aggregated metric snapshots from real telemetry rows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <p className="text-sm text-content-muted">No metrics recorded.</p>
        ) : (
          <Grid columns={3} gap={3}>
            {metrics.map((metric) => (
              <div
                key={`${metric.subsystem}-${metric.metricName}`}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <p className="text-xs uppercase tracking-wide text-content-muted">
                  {telemetrySubsystemLabels[metric.subsystem]}
                </p>
                <p className="mt-2 text-sm font-semibold text-content-primary">
                  {metric.metricName.replaceAll("_", " ")}
                </p>
                <p className="mt-2 text-lg text-content-primary">
                  {formatMetricValue(metric.value, metric.unit)}
                </p>
              </div>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}

