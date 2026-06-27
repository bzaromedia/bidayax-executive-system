import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardLiveProviderSummary } from "@bidayax/types";

type TestCallModeStatusProps = {
  readonly summary: DashboardLiveProviderSummary;
};

export function TestCallModeStatus({ summary }: TestCallModeStatusProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Test calls</Badge>
        <CardTitle>Test-call mode status</CardTitle>
        <CardDescription>
          Test mode separates provider readiness from production call operation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-content-primary">
          {summary.voiceTestMode ? "Test mode enabled" : "Test mode disabled"}
        </p>
        <p className="mt-2 text-sm text-content-secondary">
          {summary.voiceTestMode
            ? "Production voice remains blocked while test mode is enabled."
            : "Production voice still requires every provider and approval gate."}
        </p>
      </CardContent>
    </Card>
  );
}

