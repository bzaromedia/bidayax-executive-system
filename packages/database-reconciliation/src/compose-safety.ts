import { readFileSync } from "node:fs";

import {
  executiveCardBindings,
  executiveCardComposeProject,
  executiveCardInternalNetworkKey,
  executiveCardInternalNetworkName,
  executiveCardVolumeName
} from "./canonical-contract.js";
import type { ComposeInvariantResult, ComposeSafetyInput } from "./types.js";

const allowedServices = new Set(["postgres", "migrate", "card", "dashboard"]);
const allowedBindings = new Set<string>([executiveCardBindings.card, executiveCardBindings.dashboard]);

function result(invariant: string, passed: boolean, evidence: string[]): ComposeInvariantResult {
  return {
    invariant,
    status: passed ? "PASSED" : "FAILED",
    evidence
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripYamlScalar(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function splitLines(renderedCompose: string): string[] {
  return renderedCompose.replace(/\r\n/g, "\n").split("\n");
}

function getSectionLines(lines: string[], sectionName: string): string[] {
  const startIndex = lines.findIndex((line) => line.trim() === `${sectionName}:` && !line.startsWith(" "));
  if (startIndex === -1) {
    return [];
  }

  const collected: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (line.length > 0 && !line.startsWith(" ")) {
      break;
    }
    collected.push(line);
  }

  return collected;
}

function getNamedChildren(sectionLines: string[]): string[] {
  return sectionLines
    .map((line) => line.match(/^ {2}([A-Za-z0-9_-]+):\s*$/)?.[1])
    .filter((value): value is string => Boolean(value));
}

function getNamedChildBlock(sectionLines: string[], childName: string): string[] {
  const startIndex = sectionLines.findIndex((line) => line.trim() === `${childName}:` && line.startsWith("  "));
  if (startIndex === -1) {
    return [];
  }

  const collected: string[] = [];
  for (let index = startIndex + 1; index < sectionLines.length; index += 1) {
    const line = sectionLines[index] ?? "";
    if (line.match(/^ {2}[A-Za-z0-9_-]+:\s*$/)) {
      break;
    }
    collected.push(line);
  }

  return collected;
}

function collectPortMappings(renderedCompose: string): string[] {
  const lines = splitLines(renderedCompose);
  const mappings: string[] = [];
  let portsIndent: number | null = null;

  for (const line of lines) {
    if (/^\s+ports:\s*$/.test(line)) {
      portsIndent = line.search(/\S/);
      continue;
    }

    if (portsIndent !== null) {
      const currentIndent = line.search(/\S/);
      if (currentIndent === -1) {
        continue;
      }
      if (currentIndent <= portsIndent) {
        portsIndent = null;
        continue;
      }

      const match = line.match(/^\s*-\s*"([^"]+)"\s*$/);
      if (match?.[1]) {
        mappings.push(match[1]);
      }
    }
  }

  return mappings;
}

function findEnvironmentValue(renderedCompose: string, variable: string): string | null {
  const mappingMatch = renderedCompose.match(new RegExp(`^\\s+${escapeRegex(variable)}:\\s*(.+)$`, "m"));
  if (mappingMatch?.[1]) {
    return stripYamlScalar(mappingMatch[1]);
  }

  const listMatch = renderedCompose.match(new RegExp(`^\\s*-\\s+${escapeRegex(variable)}=(.+)$`, "m"));
  if (listMatch?.[1]) {
    return stripYamlScalar(listMatch[1]);
  }

  return null;
}

function isFalseLike(value: string | null): boolean {
  return value !== null && ["0", "false", "no", "off", "disabled"].includes(value.trim().toLowerCase());
}

export function validateComposeSafety(input: ComposeSafetyInput): ComposeInvariantResult[] {
  const { actualProjectName, expectedProjectName, renderedCompose } = input;
  const lines = splitLines(renderedCompose);
  const servicesSection = getSectionLines(lines, "services");
  const networksSection = getSectionLines(lines, "networks");
  const volumesSection = getSectionLines(lines, "volumes");
  const services = getNamedChildren(servicesSection);
  const networks = getNamedChildren(networksSection);
  const volumes = getNamedChildren(volumesSection);
  const portMappings = collectPortMappings(renderedCompose);
  const unexpectedServices = services.filter((service) => !allowedServices.has(service));
  const unexpectedBindings = portMappings.filter((binding) => !allowedBindings.has(binding));
  const mode = findEnvironmentValue(renderedCompose, "TELEPHONY_PROVIDER_MODE");
  const voiceProvider = findEnvironmentValue(renderedCompose, "VOICE_RUNTIME_PROVIDER");
  const liveInbound = findEnvironmentValue(renderedCompose, "LIVE_INBOUND_CALLS_ENABLED");
  const outboundCalls = findEnvironmentValue(renderedCompose, "OUTBOUND_CALLS_ENABLED");
  const productionCalls = findEnvironmentValue(renderedCompose, "ALLOW_PRODUCTION_CALLS");
  const callTransfer = findEnvironmentValue(renderedCompose, "CALL_TRANSFER_ENABLED");
  const migrateBlock = getNamedChildBlock(servicesSection, "migrate").join("\n");

  return [
    result("project-name-operator-scope", actualProjectName.trim().length > 0 && actualProjectName === expectedProjectName, [
      `expected compose project ${expectedProjectName}`,
      `received compose project ${actualProjectName || "<empty>"}`
    ]),
    result("card-loopback-binding", portMappings.includes(executiveCardBindings.card), [
      `expected ${executiveCardBindings.card}`
    ]),
    result("dashboard-loopback-binding", portMappings.includes(executiveCardBindings.dashboard), [
      `expected ${executiveCardBindings.dashboard}`
    ]),
    result("postgres-not-public", !portMappings.some((binding) => /(^|:)5432(?::|$)/.test(binding)), [
      "postgres host binding must remain absent"
    ]),
    result(
      "postgres-volume-preserved",
      volumes.includes(executiveCardVolumeName) && renderedCompose.includes(`${executiveCardVolumeName}:/var/lib/postgresql/data`),
      [`expected volume ${executiveCardVolumeName}`]
    ),
    result("single-project-services-only", services.length === allowedServices.size && unexpectedServices.length === 0, [
      `expected services ${Array.from(allowedServices).join(", ")}`,
      unexpectedServices.length > 0 ? `unexpected services ${unexpectedServices.join(", ")}` : "no unexpected services detected"
    ]),
    result(
      "authorized-networks-only",
      networks.length === 1 && networks[0] === executiveCardInternalNetworkKey && renderedCompose.includes(`name: ${executiveCardInternalNetworkName}`),
      [`expected only ${executiveCardInternalNetworkKey} named ${executiveCardInternalNetworkName}`]
    ),
    result("no-added-public-listeners", unexpectedBindings.length === 0, [
      unexpectedBindings.length > 0 ? `unexpected bindings ${unexpectedBindings.join(", ")}` : "no unexpected public listeners detected"
    ]),
    result("migrate-profile-one-shot", /-\s+migrate/.test(migrateBlock) && /restart:\s*(?:"no"|'no'|no)/.test(migrateBlock), [
      "migrate service must remain profile-scoped and non-restarting"
    ]),
    result("telephony-disabled", mode === "disabled" || mode === "sandbox", [
      `received TELEPHONY_PROVIDER_MODE=${mode ?? "<missing>"}`
    ]),
    result("voice-disabled", voiceProvider === "none" || voiceProvider === "disabled", [
      `received VOICE_RUNTIME_PROVIDER=${voiceProvider ?? "<missing>"}`
    ]),
    result("live-inbound-disabled", isFalseLike(liveInbound), [
      `received LIVE_INBOUND_CALLS_ENABLED=${liveInbound ?? "<missing>"}`
    ]),
    result("outbound-calls-disabled", isFalseLike(outboundCalls), [
      `received OUTBOUND_CALLS_ENABLED=${outboundCalls ?? "<missing>"}`
    ]),
    result("production-calling-disabled", isFalseLike(productionCalls), [
      `received ALLOW_PRODUCTION_CALLS=${productionCalls ?? "<missing>"}`
    ]),
    result("call-transfer-disabled", isFalseLike(callTransfer), [
      `received CALL_TRANSFER_ENABLED=${callTransfer ?? "<missing>"}`
    ])
  ];
}

export function validateComposeSafetyFile(
  filePath: string,
  actualProjectName: string,
  expectedProjectName = executiveCardComposeProject
): ComposeInvariantResult[] {
  return validateComposeSafety({
    expectedProjectName,
    actualProjectName,
    renderedCompose: readFileSync(filePath, "utf8")
  });
}
