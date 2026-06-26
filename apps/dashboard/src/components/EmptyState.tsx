import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardStatus } from "../types/dashboard";

type EmptyStateProps = {
  readonly status: DashboardStatus;
  readonly message: string;
};

const labels = {
  not_configured: "Configuration",
  query_failed: "Ledger unavailable",
  ready: "No events"
} as const satisfies Record<DashboardStatus, string>;

export function EmptyState({ message, status }: EmptyStateProps) {
  return (
    <Card className="border-border-strong bg-surface-panel">
      <CardHeader>
        <Badge variant={status === "ready" ? "neutral" : "accent"}>{labels[status]}</Badge>
        <CardTitle>Interaction ledger has no visible activity</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-content-muted">
          The dashboard is waiting for real `interaction_events` rows before showing
          performance summaries.
        </p>
      </CardContent>
    </Card>
  );
}
