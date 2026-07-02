import type { PropsWithChildren } from "react";

export function CardShell({ children }: PropsWithChildren) {
  return (
    <section className="card-stage">
      <div className="card-stage-container">{children}</div>
    </section>
  );
}
