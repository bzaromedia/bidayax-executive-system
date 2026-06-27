import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardTelemetryEvent } from "@bidayax/types";
import { formatShortDate } from "../lib/formatters";
import {
  telemetrySeverityLabels,
  telemetryStatusLabels,
  telemetrySubsystemLabels
} from "../lib/telemetry-formatters";

type TelemetryEventFeedProps = {
  readonly events: readonly DashboardTelemetryEvent[];
};

export function TelemetryEventFeed({ events }: TelemetryEventFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent telemetry events</CardTitle>
        <CardDescription>Latest structured events recorded by subsystem.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-content-muted">No telemetry events recorded.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">
                    {event.eventName.replaceAll("_", " ")}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="neutral">
                      {telemetrySubsystemLabels[event.subsystem]}
                    </Badge>
                    <Badge variant={event.status === "success" ? "accent" : "neutral"}>
                      {telemetryStatusLabels[event.status]}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-content-secondary">
                  {telemetrySeverityLabels[event.severity]} ·{" "}
                  {formatShortDate(event.createdAt)}
                  {event.durationMs === null ? "" : ` · ${event.durationMs} ms`}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

