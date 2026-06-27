import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardImprovementCandidate } from "@bidayax/types";
import { formatShortDate } from "../lib/formatters";
import { formatImprovementLabel, formatScore } from "../lib/improvement-formatters";

type CandidateReviewListProps = {
  readonly candidates: readonly DashboardImprovementCandidate[];
};

export function CandidateReviewList({ candidates }: CandidateReviewListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate review list</CardTitle>
        <CardDescription>
          Proposed changes require human approval and future sandbox testing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <p className="text-sm text-content-muted">No candidates generated.</p>
        ) : (
          <div className="space-y-3">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">{candidate.title}</p>
                  <Badge variant="neutral">
                    {formatImprovementLabel(candidate.status)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                  {candidate.proposedChangeSummary}
                </p>
                <div className="mt-3 grid gap-2 text-xs text-content-muted md:grid-cols-4">
                  <span>Priority {formatScore(candidate.priorityScore)}</span>
                  <span>Evidence {formatScore(candidate.evidenceScore)}</span>
                  <span>Risk {formatScore(candidate.riskScore)}</span>
                  <span>{formatShortDate(candidate.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
