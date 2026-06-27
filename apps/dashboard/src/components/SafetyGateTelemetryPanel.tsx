import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardTelemetrySafetyGate } from "@bidayax/types";
import { formatShortDate } from "../lib/formatters";
import {
  telemetrySafetyGateDecisionLabels,
  telemetrySubsystemLabels
} from "../lib/telemetry-formatters";

type SafetyGateTelemetryPanelProps = {
  readonly events: readonly DashboardTelemetrySafetyGate[];
};

export function SafetyGateTelemetryPanel({
  events
}: SafetyGateTelemetryPanelProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Safety</Badge>
        <CardTitle>Safety gate telemetry</CardTitle>
        <CardDescription>
          Recorded allow/block/warning decisions and reason codes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-content-muted">
            No safety gate telemetry recorded.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">
                    {event.gateName.replaceAll("_", " ")}
                  </p>
                  <Badge variant={event.decision === "blocked" ? "neutral" : "accent"}>
                    {telemetrySafetyGateDecisionLabels[event.decision]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-content-secondary">
                  {telemetrySubsystemLabels[event.subsystem]} ·{" "}
                  {formatShortDate(event.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.reasonCodes.map((reasonCode) => (
                    <Badge key={reasonCode} variant="neutral">
                      {reasonCode}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

