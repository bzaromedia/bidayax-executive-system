import { ApprovalGatePanel } from "@/components/ApprovalGatePanel";
import { CandidateReviewList } from "@/components/CandidateReviewList";
import { DashboardShell } from "@/components/DashboardShell";
import { EvidenceScoreCard } from "@/components/EvidenceScoreCard";
import { ImprovementEmptyState } from "@/components/ImprovementEmptyState";
import { ImprovementEngineSummary } from "@/components/ImprovementEngineSummary";
import { LineageArchivePanel } from "@/components/LineageArchivePanel";
import { OpportunityFeed } from "@/components/OpportunityFeed";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { getImprovementEngineDashboardData } from "@/data/improvement-queries";

export const dynamic = "force-dynamic";

export default async function ImprovementEnginePage() {
  const data = await getImprovementEngineDashboardData();
  const generatedAt = new Date().toISOString();
  const shouldShowEmptyState =
    data.status !== "ready" || data.summary.opportunityCount === 0;

  return (
    <DashboardShell
      description="Evidence-backed improvement proposals from telemetry. Phase 13 stops before implementation or deployment."
      generatedAt={generatedAt}
      status={data.status}
      title="BidayaX Evolutionary Improvement Engine"
    >
      {shouldShowEmptyState ? (
        <ImprovementEmptyState
          status={data.status}
          statusMessage={data.statusMessage}
        />
      ) : null}
      <ImprovementEngineSummary summary={data.summary} />
      <div className="grid gap-6 xl:grid-cols-2">
        <EvidenceScoreCard candidates={data.candidates} />
        <RiskScoreCard candidates={data.candidates} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <OpportunityFeed opportunities={data.opportunities} />
        <CandidateReviewList candidates={data.candidates} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <LineageArchivePanel lineage={data.lineage} />
        <ApprovalGatePanel approvals={data.approvals} candidates={data.candidates} />
      </div>
    </DashboardShell>
  );
}
