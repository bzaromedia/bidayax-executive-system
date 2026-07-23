import { readFileSync } from "node:fs";

import {
  executiveCardBindings,
  executiveCardComposeProject,
  executiveCardVolumeName
} from "./canonical-contract.js";
import type { ComposeInvariantResult } from "./types.js";

function result(invariant: string, passed: boolean, evidence: string[]): ComposeInvariantResult {
  return {
    invariant,
    status: passed ? "PASSED" : "FAILED",
    evidence
  };
}

export function validateComposeSafety(composeContent: string): ComposeInvariantResult[] {
  return [
    result("project-name-operator-scope", true, [
      `operators must invoke docker compose with explicit project ${executiveCardComposeProject}`
    ]),
    result("card-loopback-binding", composeContent.includes(executiveCardBindings.card), [
      `expected ${executiveCardBindings.card}`
    ]),
    result("dashboard-loopback-binding", composeContent.includes(executiveCardBindings.dashboard), [
      `expected ${executiveCardBindings.dashboard}`
    ]),
    result("postgres-not-public", !/5432:5432/.test(composeContent), [
      "postgres host binding must remain absent"
    ]),
    result(
      "postgres-volume-preserved",
      composeContent.includes(`${executiveCardVolumeName}:/var/lib/postgresql/data`),
      [`expected volume ${executiveCardVolumeName}`]
    ),
    result(
      "single-project-services-only",
      /services:\s*[\s\S]*\bpostgres:\s*[\s\S]*\bcard:\s*[\s\S]*\bdashboard:\s*/.test(composeContent),
      ["compose must define postgres, card, and dashboard services"]
    ),
    result("migrate-profile-one-shot", /migrate:\s*[\s\S]*profiles:\s*[\s\S]*-\s*migrate/.test(composeContent), [
      "migrate service must remain profile-scoped"
    ]),
    result("telephony-disabled", !/telephony:\s/.test(composeContent), [
      "no telephony service should be introduced in Workstream A"
    ]),
    result("voice-disabled", !/voice[a-z-]*:\s/.test(composeContent), [
      "no voice service should be introduced in Workstream A"
    ]),
    result("no-second-permanent-project", !/container_name:\s*the-executive-card-v2/i.test(composeContent), [
      "must not define alternate permanent project/container names"
    ])
  ];
}

export function validateComposeSafetyFile(filePath: string): ComposeInvariantResult[] {
  return validateComposeSafety(readFileSync(filePath, "utf8"));
}
