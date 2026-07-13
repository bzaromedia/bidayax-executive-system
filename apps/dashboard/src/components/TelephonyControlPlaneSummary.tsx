import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bidayax/ui";

const foundationSections = [
  ["Phone numbers", "Tenant-owned number model only"],
  ["Calls", "Provider-independent call sessions"],
  ["Queues", "Tenant-scoped queue policy"],
  ["Callbacks", "Queued callback request lifecycle"],
  ["Appointments", "Internal appointment intent lifecycle"],
  ["Routing rules", "Business-hour, language, overflow, and escalation policy"],
  ["Voice profiles", "Future voice preference metadata"],
  ["Usage", "Append-only future cost and quota ledger"],
  ["Audit", "Append-only control-plane evidence"]
] as const;

export function TelephonyControlPlaneSummary() {
  return (
    <Card>
      <CardHeader>
        <Badge variant="accent">Telephony Control Plane</Badge>
        <CardTitle>Provider-independent telephony foundation</CardTitle>
        <CardDescription>
          Domain model, policy, queueing, usage, and audit structures are ready
          for future adapters. Production calling remains disabled.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {foundationSections.map(([label, detail]) => (
            <div
              key={label}
              className="rounded-bxMd border border-border-subtle bg-surface-panel p-4"
            >
              <p className="text-xs uppercase tracking-wide text-content-muted">
                {label}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-content-primary">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
