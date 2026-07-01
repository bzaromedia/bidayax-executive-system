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
        <CardTitle>Safety-gated future telephony integration</CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-content-muted">
          Telephony remains a safety-gated future integration. Outbound calling
          and voice agents are disabled unless a future production approval
          process explicitly enables them.
        </p>
      </CardContent>
    </Card>
  );
}
