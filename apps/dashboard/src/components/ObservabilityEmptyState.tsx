import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardStatus } from "@bidayax/types";

type ObservabilityEmptyStateProps = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
};

export function ObservabilityEmptyState({
  status,
  statusMessage
}: ObservabilityEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">{status}</Badge>
        <CardTitle>Observability empty state</CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-content-secondary">
          Run the Phase 12 migration and telemetry verification scripts to begin
          collecting measurement data.
        </p>
      </CardContent>
    </Card>
  );
}

