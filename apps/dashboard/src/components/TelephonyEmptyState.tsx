import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardStatus } from "../types/dashboard";

type TelephonyEmptyStateProps = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
};

export function TelephonyEmptyState({
  status,
  statusMessage
}: TelephonyEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant={status === "ready" ? "neutral" : "accent"}>Telephony</Badge>
        <CardTitle>Telephony preparation pending</CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-content-muted">
          Phase 9 prepares live voice integration with mock provider defaults.
          Outbound calling and voice agents are disabled unless future safety gates
          explicitly allow them.
        </p>
      </CardContent>
    </Card>
  );
}
