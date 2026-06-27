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
          Current state: {status}. Phase 13 will not create fake opportunities,
          fake benchmarks, automatic implementation, or production deployment.
        </p>
      </CardContent>
    </Card>
  );
}
