import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardStatus } from "../types/dashboard";

type ReceptionistEmptyStateProps = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
};

export function ReceptionistEmptyState({
  status,
  statusMessage
}: ReceptionistEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant={status === "ready" ? "neutral" : "accent"}>Receptionist</Badge>
        <CardTitle>Receptionist foundation pending</CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-content-muted">
          Receptionist workflow records appear after card visitors submit routed
          requests or after internal foundation records are loaded. Live calls,
          direct email sending, calendar booking, and external workflow
          automations remain disabled unless explicitly configured.
        </p>
      </CardContent>
    </Card>
  );
}
