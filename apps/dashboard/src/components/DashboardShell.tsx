import type { ReactNode } from "react";
import { Badge, Container, Section } from "@bidayax/ui";
import type { DashboardStatus } from "../types/dashboard";

type DashboardShellProps = {
  readonly children: ReactNode;
  readonly generatedAt: string;
  readonly status: DashboardStatus;
};

const statusLabels = {
  not_configured: "Database not configured",
  query_failed: "Ledger unavailable",
  ready: "Ledger connected"
} as const satisfies Record<DashboardStatus, string>;

export function DashboardShell({ children, generatedAt, status }: DashboardShellProps) {
  return (
    <Section tone="canvas" spacing="lg" className="dashboard-stage min-h-screen">
      <Container size="xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-border-subtle pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant={status === "ready" ? "accent" : "neutral"}>
              {statusLabels[status]}
            </Badge>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-normal text-content-primary md:text-4xl">
              Executive Interaction Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-content-secondary">
              Anonymous card interaction activity from the QR Interaction Event Ledger.
            </p>
          </div>
          <p className="text-sm text-content-muted">
            Generated{" "}
            <time dateTime={generatedAt}>
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
              }).format(new Date(generatedAt))}
            </time>
          </p>
        </header>
        <main className="space-y-6">{children}</main>
      </Container>
    </Section>
  );
}
