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
          Phase 8 shows simulated receptionist records only. No live calls,
          emails, calendar bookings, or external workflow automations are active.
        </p>
      </CardContent>
    </Card>
  );
}
