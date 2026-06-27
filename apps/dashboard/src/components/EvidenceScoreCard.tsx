import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardImprovementCandidate } from "@bidayax/types";
import { formatScore } from "../lib/improvement-formatters";

type EvidenceScoreCardProps = {
  readonly candidates: readonly DashboardImprovementCandidate[];
};

export function EvidenceScoreCard({ candidates }: EvidenceScoreCardProps) {
  const topCandidate = candidates[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evidence score</CardTitle>
        <CardDescription>Higher scores indicate stronger telemetry support.</CardDescription>
      </CardHeader>
      <CardContent>
        {topCandidate ? (
          <>
            <p className="text-3xl font-semibold text-content-primary">
              {formatScore(topCandidate.evidenceScore)}
            </p>
            <p className="mt-2 text-sm text-content-secondary">
              Strongest current candidate: {topCandidate.title}
            </p>
          </>
        ) : (
          <p className="text-sm text-content-muted">No evidence scores available.</p>
        )}
      </CardContent>
    </Card>
  );
}
