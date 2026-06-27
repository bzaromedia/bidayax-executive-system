import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardReceptionistSummary } from "../types/dashboard";
import { formatInteger } from "../lib/formatters";

type ReceptionistSummaryProps = {
  readonly summary: DashboardReceptionistSummary;
};

export function ReceptionistSummary({ summary }: ReceptionistSummaryProps) {
  const rows = [
    ["Interactions", summary.interactionCount],
    ["Simulated", summary.simulatedCount],
    ["Tasks", summary.taskCount],
    ["Escalations", summary.escalationCount],
    ["Languages", summary.languageCount]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Receptionist</Badge>
        <CardTitle>Receptionist foundation summary</CardTitle>
        <CardDescription>
          Simulated operating data for future voice, email, scheduling, and escalation workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <p className="text-xs uppercase tracking-wide text-content-muted">
                {label}
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold text-content-primary">
                {formatInteger(value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
