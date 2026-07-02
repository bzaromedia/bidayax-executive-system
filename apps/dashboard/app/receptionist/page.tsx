import { DashboardShell } from "@/components/DashboardShell";
import { ReceptionistEmptyState } from "@/components/ReceptionistEmptyState";
import { ReceptionistLanguageBreakdown } from "@/components/ReceptionistLanguageBreakdown";
import { ReceptionistRequestsPanel } from "@/components/ReceptionistRequestsPanel";
import { ReceptionistSummary } from "@/components/ReceptionistSummary";
import { ReceptionistTaskList } from "@/components/ReceptionistTaskList";
import { getReceptionistDashboardData } from "@/data/receptionist-queries";

export const dynamic = "force-dynamic";

export default async function ReceptionistPage() {
  const data = await getReceptionistDashboardData();
  const shouldShowEmptyState =
    data.status !== "ready" || data.summary.interactionCount === 0;

  return (
    <DashboardShell
      generatedAt={new Date().toISOString()}
      status={data.status}
      title="Polyglot Receptionist Workflow"
      description="Card-submitted multilingual requests, routing state, and human-approved follow-up tasks."
    >
      {shouldShowEmptyState ? (
        <ReceptionistEmptyState
          status={data.status}
          statusMessage={data.statusMessage}
        />
      ) : (
        <>
          <ReceptionistSummary summary={data.summary} />
          <ReceptionistLanguageBreakdown
            intents={data.intentBreakdown}
            languages={data.languageBreakdown}
          />
          <div className="grid gap-6 xl:grid-cols-2">
            <ReceptionistRequestsPanel interactions={data.interactions} />
            <ReceptionistTaskList tasks={data.tasks} />
          </div>
        </>
      )}
    </DashboardShell>
  );
}

