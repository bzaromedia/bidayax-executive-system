import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { executiveCardComposeProject } from "../src/canonical-contract.js";
import { validateComposeSafety } from "../src/compose-safety.js";

function makeRenderedCompose(overrides?: {
  actualProjectName?: string;
  extraService?: string;
  cardBinding?: string;
  extraPortBinding?: string;
  cardTelephonyMode?: string;
  omitDashboard?: boolean;
}) {
  const runtimeEnvironment = (mode = "disabled") => `    environment:
      TELEPHONY_PROVIDER: mock
      TELEPHONY_PROVIDER_MODE: ${mode}
      VOICE_RUNTIME_PROVIDER: none
      VOICE_AGENT_ENABLED: "false"
      VOICE_TEST_MODE: "true"
      LIVE_INBOUND_CALLS_ENABLED: "false"
      OUTBOUND_CALLS_ENABLED: "false"
      ALLOW_PRODUCTION_CALLS: "false"
      REQUIRE_HUMAN_APPROVAL: "true"
      CALL_TRANSFER_ENABLED: "false"
      VOICE_RECORDING_DISCLOSURE_ENABLED: "false"`;

  return {
    actualProjectName: overrides?.actualProjectName ?? executiveCardComposeProject,
    renderedCompose: `services:
  postgres:
    environment:
      TELEPHONY_PROVIDER_MODE: disabled
      VOICE_RUNTIME_PROVIDER: none
      LIVE_INBOUND_CALLS_ENABLED: "false"
      OUTBOUND_CALLS_ENABLED: "false"
      ALLOW_PRODUCTION_CALLS: "false"
      CALL_TRANSFER_ENABLED: "false"
    volumes:
      - the_executive_card_postgres:/var/lib/postgresql/data
  migrate:
    profiles:
      - migrate
    restart: "no"
  card:
${runtimeEnvironment(overrides?.cardTelephonyMode)}
    ports:
      - "${overrides?.cardBinding ?? "127.0.0.1:3100:3000"}"
${overrides?.omitDashboard ? "" : `
  dashboard:
${runtimeEnvironment()}
    ports:
      - "127.0.0.1:3101:3001"
`}
${overrides?.extraService ?? ""}${overrides?.extraPortBinding ? `  extra:
    ports:
      - "${overrides.extraPortBinding}"
` : ""}volumes:
  the_executive_card_postgres:
networks:
  executive_card_internal:
    name: the-executive-card-internal`
  };
}

describe("compose safety validator", () => {
  it("passes on the canonical Hostinger compose artifact", () => {
    const renderedCompose = readFileSync(
      join(process.cwd(), "..", "..", "infrastructure", "docker", "docker-compose.hostinger.yml"),
      "utf8"
    );
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: executiveCardComposeProject,
      renderedCompose
    });

    expect(results.every((result) => result.status === "PASSED")).toBe(true);
  });

  it("passes on canonical rendered compose", () => {
    const fixture = makeRenderedCompose();
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
    });

    expect(results.every((result) => result.status === "PASSED")).toBe(true);
  });

  it("passes on long-form docker compose config ports and volumes", () => {
    const fixture = makeRenderedCompose();
    const longForm = fixture.renderedCompose
      .replace(
        '      - "127.0.0.1:3100:3000"',
        `      - host_ip: 127.0.0.1
        mode: ingress
        protocol: tcp
        published: "3100"
        target: 3000`
      )
      .replace(
        '      - "127.0.0.1:3101:3001"',
        `      - host_ip: 127.0.0.1
        mode: ingress
        protocol: tcp
        published: "3101"
        target: 3001`
      )
      .replace(
        "      - the_executive_card_postgres:/var/lib/postgresql/data",
        `      - source: the_executive_card_postgres
        target: /var/lib/postgresql/data
        type: volume`
      );
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: longForm
    });

    expect(results.every((result) => result.status === "PASSED")).toBe(true);
  });

  it("fails if the compose project name is blank", () => {
    const fixture = makeRenderedCompose({ actualProjectName: "" });
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
    });

    expect(results.find((result) => result.invariant === "project-name-operator-scope")?.status).toBe("FAILED");
  });

  it("fails if the compose project name is wrong", () => {
    const fixture = makeRenderedCompose({ actualProjectName: "wrong-project" });
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
    });

    expect(results.find((result) => result.invariant === "project-name-operator-scope")?.status).toBe("FAILED");
  });

  it("fails if the card host binding changes", () => {
    const fixture = makeRenderedCompose({ cardBinding: "0.0.0.0:3000:3000" });
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
    });

    expect(results.find((result) => result.invariant === "card-loopback-binding")?.status).toBe("FAILED");
  });

  it("fails if an unexpected public listener is added", () => {
    const fixture = makeRenderedCompose({ extraPortBinding: "0.0.0.0:5432:5432" });
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
    });

    expect(results.find((result) => result.invariant === "no-added-public-listeners")?.status).toBe("FAILED");
  });

  it("fails if a required service is missing", () => {
    const fixture = makeRenderedCompose({ omitDashboard: true });
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
    });

    expect(results.find((result) => result.invariant === "single-project-services-only")?.status).toBe("FAILED");
  });

  it("fails if production communications are not disabled on runtime services", () => {
    const fixture = makeRenderedCompose({ cardTelephonyMode: "sandbox" });
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
    });

    expect(results.find((result) => result.invariant === "production-communications-disabled")?.status).toBe(
      "FAILED"
    );
  });
});
