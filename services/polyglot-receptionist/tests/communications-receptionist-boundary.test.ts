import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { receptionistCommunicationsBoundary } from "../src/communications-receptionist-boundary";

describe("receptionist communications boundary", () => {
  it("keeps provider dispatch out of the receptionist runtime", () => {
    expect(receptionistCommunicationsBoundary.canDispatchProvidersDirectly).toBe(
      false
    );
    expect(receptionistCommunicationsBoundary.prohibitedConcerns).toContain(
      "provider_dispatch"
    );
  });

  it("requires the communications policy gate", () => {
    expect(
      receptionistCommunicationsBoundary.requiresCommunicationsPolicyGate
    ).toBe(true);
  });

  it("removes exported provider invocation surfaces and env-driven provider activation", () => {
    const indexSource = readFileSync(resolve(process.cwd(), "src/index.ts"), "utf8");
    const providerSource = readFileSync(
      resolve(process.cwd(), "src/provider-interfaces.ts"),
      "utf8"
    );
    const workflowSource = readFileSync(
      resolve(process.cwd(), "src/workflow-engine.ts"),
      "utf8"
    );
    const workflowNodesSource = readFileSync(
      resolve(process.cwd(), "src/workflow-nodes.ts"),
      "utf8"
    );

    expect(indexSource).not.toContain('export * from "./provider-interfaces"');

    for (const token of [
      "answerInboundCall",
      "transferCall",
      "createSession",
      "createAppointmentRequest",
      "notifyExecutive",
      "process.env"
    ]) {
      expect(providerSource).not.toContain(token);
    }

    expect(workflowSource).not.toContain(
      "resolveReceptionistProviderConfigFromEnv"
    );
    expect(workflowNodesSource).not.toContain("provider_dispatch_if_configured");
    expect(workflowNodesSource).toContain("submit_communications_command");
  });
});