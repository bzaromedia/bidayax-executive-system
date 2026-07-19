import { describe, expect, it } from "vitest";
import { communicationsApiOperationNames } from "../src/api";
import { communicationsOrchestratorResponsibilities } from "../src/orchestrator";
import { communicationsObservabilityMetrics } from "../src/observability";
import {
  channelAdapterRegistryOperationNames,
  channelAdapterRuntimeOperationNames
} from "../src/adapters";

describe("communications service contracts", () => {
  it("defines a channel-neutral API surface", () => {
    expect(communicationsApiOperationNames).toEqual([
      "requestCallback",
      "cancelCallback",
      "scheduleCommunication",
      "initiateCommunication",
      "acceptInboundCommunicationEvent",
      "escalateToHuman",
      "suppressCommunication",
      "releaseSuppression",
      "evaluateConsent",
      "evaluateBusinessHours",
      "evaluateRouting",
      "queryCommunicationStatus",
      "terminateCommunication",
      "applyTenantKillSwitch",
      "applyPlatformKillSwitch"
    ]);
  });

  it("assigns orchestration authority to the communications service", () => {
    expect(communicationsOrchestratorResponsibilities).toContain(
      "validate_identity_and_scope"
    );
    expect(communicationsOrchestratorResponsibilities).toContain(
      "select_eligible_adapter"
    );
    expect(communicationsOrchestratorResponsibilities).toContain(
      "honor_suppressions_and_kill_switches"
    );
  });

  it("defines a complete executable adapter runtime port", () => {
    expect(channelAdapterRuntimeOperationNames).toEqual([
      "submitCommand",
      "cancelCommand",
      "getHealthSnapshot",
      "normalizeStatus",
      "normalizeEvent",
      "shutdown"
    ]);
    expect(channelAdapterRegistryOperationNames).toEqual([
      "register",
      "listByChannel",
      "listAll"
    ]);
  });

  it("defines channel-neutral observability contracts", () => {
    expect(communicationsObservabilityMetrics).toContain(
      "communications.commands.requested"
    );
    expect(communicationsObservabilityMetrics).toContain(
      "communications.adapter.degraded"
    );
  });
});