import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardImprovementCandidate } from "@bidayax/types";
import { formatScore } from "../lib/improvement-formatters";

type RiskScoreCardProps = {
  readonly candidates: readonly DashboardImprovementCandidate[];
};

export function RiskScoreCard({ candidates }: RiskScoreCardProps) {
  const highestRisk = [...candidates].sort((a, b) => b.riskScore - a.riskScore)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk score</CardTitle>
        <CardDescription>Voice, safety, security, and database impact raise risk.</CardDescription>
      </CardHeader>
      <CardContent>
        {highestRisk ? (
          <>
            <p className="text-3xl font-semibold text-content-primary">
              {formatScore(highestRisk.riskScore)}
            </p>
            <p className="mt-2 text-sm text-content-secondary">
              Highest risk proposal: {highestRisk.title}
            </p>
          </>
        ) : (
          <p className="text-sm text-content-muted">No risk scores available.</p>
        )}
      </CardContent>
    </Card>
  );
}
