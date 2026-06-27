import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";
import type { DashboardOutboundCallApproval } from "../types/dashboard";
import { formatDateTime } from "../lib/formatters";
import {
  outboundApprovalLabels,
  outboundRequestStatusLabels
} from "../lib/telephony-formatters";

type OutboundCallApprovalListProps = {
  readonly requests: readonly DashboardOutboundCallApproval[];
};

export function OutboundCallApprovalList({
  requests
}: OutboundCallApprovalListProps) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="neutral">Approval</Badge>
        <CardTitle>Outbound call approvals</CardTitle>
        <CardDescription>
          Requests are approval-gated. No provider execution happens in Phase 9.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-sm font-semibold text-content-primary">
                    {request.executiveName}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    To {request.maskedToNumber} / requested by {request.requestedBy}
                  </p>
                </div>
                <p className="text-xs text-content-muted">
                  {outboundApprovalLabels[request.approvalStatus]} /{" "}
                  {outboundRequestStatusLabels[request.status]}
                </p>
              </div>
              <p className="mt-3 text-sm text-content-secondary">
                {request.reason}
              </p>
              <p className="mt-3 text-xs text-content-muted">
                {formatDateTime(request.createdAt)}
              </p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
