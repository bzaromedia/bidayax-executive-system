import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardSubsystemHealth } from "@bidayax/types";
import { formatInteger } from "../lib/formatters";
import { telemetrySubsystemLabels } from "../lib/telemetry-formatters";

type SubsystemHealthMatrixProps = {
  readonly rows: readonly DashboardSubsystemHealth[];
};

export function SubsystemHealthMatrix({ rows }: SubsystemHealthMatrixProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subsystem health matrix</CardTitle>
        <CardDescription>
          Health is derived only from recorded telemetry, errors, and blocked
          safety gates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-content-muted">
            No subsystem telemetry recorded.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((row) => (
              <div
                key={row.subsystem}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">
                    {telemetrySubsystemLabels[row.subsystem]}
                  </p>
                  <Badge variant={row.status === "healthy" ? "accent" : "neutral"}>
                    {row.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-content-secondary">
                  {formatInteger(row.eventCount)} events ·{" "}
                  {formatInteger(row.errorCount)} errors ·{" "}
                  {formatInteger(row.blockedSafetyGateCount)} blocked gates
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

