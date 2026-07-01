import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardStatus } from "@bidayax/types";

type ImprovementEmptyStateProps = {
  readonly status: DashboardStatus;
  readonly statusMessage: string;
};

export function ImprovementEmptyState({
  status,
  statusMessage
}: ImprovementEmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Improvement engine awaiting evidence</CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-content-secondary">
          Current state: {status}. Phase 13 is a human-approved recommendation
          foundation and does not implement or deploy changes automatically.
        </p>
      </CardContent>
    </Card>
  );
}
