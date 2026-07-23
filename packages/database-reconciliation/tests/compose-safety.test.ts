import { describe, expect, it } from "vitest";

import { executiveCardComposeProject } from "../src/canonical-contract.js";
import { validateComposeSafety } from "../src/compose-safety.js";

function makeRenderedCompose(overrides?: {
  actualProjectName?: string;
  extraService?: string;
  cardBinding?: string;
  extraPortBinding?: string;
}) {
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
    ports:
      - "${overrides?.cardBinding ?? "127.0.0.1:3100:3000"}"
  dashboard:
    ports:
      - "127.0.0.1:3101:3001"
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
  it("passes on canonical rendered compose", () => {
    const fixture = makeRenderedCompose();
    const results = validateComposeSafety({
      expectedProjectName: executiveCardComposeProject,
      actualProjectName: fixture.actualProjectName,
      renderedCompose: fixture.renderedCompose
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
});
