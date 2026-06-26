import type { PropsWithChildren } from "react";
import { Container, Section } from "@bidayax/ui";

export function CardShell({ children }: PropsWithChildren) {
  return (
    <Section tone="canvas" spacing="lg" className="card-stage min-h-screen">
      <Container size="xl" className="flex min-h-[calc(100vh-var(--bx-space-16))] items-center">
        {children}
      </Container>
    </Section>
  );
}
