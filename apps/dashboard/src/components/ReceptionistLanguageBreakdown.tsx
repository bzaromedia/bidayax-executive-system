import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type {
  DashboardReceptionistIntentBreakdown,
  DashboardReceptionistLanguageBreakdown
} from "../types/dashboard";
import { formatInteger, formatPercent } from "../lib/formatters";
import { receptionistIntentLabels } from "../lib/receptionist-formatters";

type ReceptionistLanguageBreakdownProps = {
  readonly languages: readonly DashboardReceptionistLanguageBreakdown[];
  readonly intents: readonly DashboardReceptionistIntentBreakdown[];
};

export function ReceptionistLanguageBreakdown({
  intents,
  languages
}: ReceptionistLanguageBreakdownProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <Badge variant="neutral">Language</Badge>
          <CardTitle>Language breakdown</CardTitle>
          <CardDescription>
            Simulated language metadata. Live fluency is future work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {languages.map((row) => (
              <div key={row.language} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-content-primary">{row.language}</p>
                  <p className="text-sm text-content-muted">
                    {formatInteger(row.count)} / {formatPercent(row.share)}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-bxSm bg-surface-inset">
                  <div
                    className="h-full rounded-bxSm bg-content-accent"
                    style={{ width: `${Math.max(row.share * 100, row.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Badge variant="neutral">Intent</Badge>
          <CardTitle>Intent classification preview</CardTitle>
          <CardDescription>
            Deterministic simulated categories, not LLM or live receptionist decisions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {intents.map((row) => (
              <div
                key={row.intent}
                className="flex items-center justify-between gap-4 rounded-bxMd border border-border-subtle bg-surface-panel p-4"
              >
                <p className="text-sm text-content-primary">
                  {receptionistIntentLabels[row.intent]}
                </p>
                <p className="text-sm text-content-muted">
                  {formatInteger(row.count)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
