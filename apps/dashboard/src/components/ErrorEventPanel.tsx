import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardTelemetryError } from "@bidayax/types";
import { formatShortDate } from "../lib/formatters";
import {
  telemetrySeverityLabels,
  telemetrySubsystemLabels
} from "../lib/telemetry-formatters";

type ErrorEventPanelProps = {
  readonly errors: readonly DashboardTelemetryError[];
};

export function ErrorEventPanel({ errors }: ErrorEventPanelProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Errors</Badge>
        <CardTitle>Error event panel</CardTitle>
        <CardDescription>
          Safe error records only. No stack traces, secrets, or raw payloads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <p className="text-sm text-content-muted">No error telemetry recorded.</p>
        ) : (
          <div className="space-y-3">
            {errors.map((error) => (
              <div
                key={error.id}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">
                    {error.errorCode}
                  </p>
                  <Badge variant="neutral">
                    {telemetrySubsystemLabels[error.subsystem]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-content-secondary">
                  {error.safeMessage}
                </p>
                <p className="mt-2 text-xs text-content-muted">
                  {error.errorCategory} · {telemetrySeverityLabels[error.severity]} ·{" "}
                  {formatShortDate(error.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

