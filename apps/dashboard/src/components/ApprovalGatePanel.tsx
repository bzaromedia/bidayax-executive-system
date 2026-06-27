import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardImprovementApproval, DashboardImprovementCandidate } from "@bidayax/types";
import { formatShortDate } from "../lib/formatters";
import { formatImprovementLabel } from "../lib/improvement-formatters";

type ApprovalGatePanelProps = {
  readonly approvals: readonly DashboardImprovementApproval[];
  readonly candidates: readonly DashboardImprovementCandidate[];
};

export function ApprovalGatePanel({ approvals, candidates }: ApprovalGatePanelProps) {
  const pendingCount = candidates.filter((candidate) =>
    ["needs_review", "proposed", "sandbox_required"].includes(candidate.status)
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Human approval gate</CardTitle>
        <CardDescription>
          Approval marks a candidate for future sandbox work only. It does not deploy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-bxMd border border-border-subtle bg-surface-panel p-4">
          <p className="text-sm text-content-secondary">
            {pendingCount} candidate{pendingCount === 1 ? "" : "s"} require review.
          </p>
        </div>
        {approvals.length === 0 ? (
          <p className="text-sm text-content-muted">No approval events recorded.</p>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-content-primary">
                    {approval.decidedBy}
                  </p>
                  <Badge variant="neutral">
                    {formatImprovementLabel(approval.decision)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-content-secondary">
                  {approval.decisionNotes}
                </p>
                <p className="mt-2 text-xs text-content-muted">
                  {formatShortDate(approval.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
