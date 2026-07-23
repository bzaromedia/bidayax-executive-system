import { readFileSync } from "node:fs";

import { canonicalEnvironmentDefinitions } from "./canonical-contract.js";
import type { EnvironmentValidationResult } from "./types.js";

type ParsedEnvironment = Map<string, string>;

function parseEnvironmentFile(content: string): ParsedEnvironment {
  const parsed = new Map<string, string>();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    parsed.set(line.slice(0, separatorIndex), line.slice(separatorIndex + 1));
  }

  return parsed;
}

function classifyExpectedValue(value: string, expected: typeof canonicalEnvironmentDefinitions[number]["expectedValue"]) {
  if (expected === undefined) {
    return { valid: value.length > 0, evidence: value.length > 0 ? "present" : "empty" };
  }

  if (typeof expected === "boolean") {
    return {
      valid: value === String(expected),
      evidence: `expected ${expected}, received classified state`
    };
  }

  if (typeof expected === "string") {
    return {
      valid: value === expected,
      evidence: `expected ${expected}, received classified state`
    };
  }

  return {
    valid: expected.oneOf.includes(value),
    evidence: `expected one of ${expected.oneOf.join(", ")}`
  };
}

export function validateEnvironmentVariables(environment: ParsedEnvironment): EnvironmentValidationResult[] {
  const results: EnvironmentValidationResult[] = [];
  const knownNames = new Set(canonicalEnvironmentDefinitions.map((definition) => definition.name));

  for (const definition of canonicalEnvironmentDefinitions) {
    const value = environment.get(definition.name);

    if (value === undefined) {
      results.push({
        variable: definition.name,
        group: definition.group,
        classification: definition.required ? "MISSING_REQUIRED" : "MISSING_OPTIONAL",
        evidence: definition.reservedForFuture ? ["future optional reservation"] : ["variable missing"]
      });
      continue;
    }

    if (definition.deprecated) {
      results.push({
        variable: definition.name,
        group: definition.group,
        classification: "DEPRECATED",
        evidence: definition.renamedTo ? [`rename to ${definition.renamedTo}`] : ["deprecated variable present"]
      });
      continue;
    }

    if (value.length === 0) {
      results.push({
        variable: definition.name,
        group: definition.group,
        classification: definition.secret ? "REQUIRES_SECRET_PROVISIONING" : "PRESENT_EMPTY",
        evidence: definition.secret ? ["secret provisioning required"] : ["variable present but empty"]
      });
      continue;
    }

    const expectation = classifyExpectedValue(value, definition.expectedValue);
    results.push({
      variable: definition.name,
      group: definition.group,
      classification: expectation.valid ? "PRESENT_VALID" : "PRESENT_INVALID",
      evidence: [expectation.evidence]
    });
  }

  for (const [name] of environment.entries()) {
    if (knownNames.has(name)) {
      continue;
    }

    results.push({
      variable: name,
      group: "COMMUNICATIONS",
      classification: "LIVE_ONLY",
      evidence: ["variable exists in live file but not in canonical contract"]
    });
  }

  return results.sort((left, right) => left.variable.localeCompare(right.variable));
}

export function validateEnvironmentFile(filePath: string): EnvironmentValidationResult[] {
  return validateEnvironmentVariables(parseEnvironmentFile(readFileSync(filePath, "utf8")));
}
