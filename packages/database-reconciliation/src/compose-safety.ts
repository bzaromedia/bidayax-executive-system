import { readFileSync } from "node:fs";

import {
  executiveCardBindings,
  executiveCardComposeProject,
  executiveCardInternalNetworkKey,
  executiveCardInternalNetworkName,
  executiveCardVolumeName
} from "./canonical-contract.ts";
import type { ComposeInvariantResult, ComposeSafetyInput } from "./types.ts";

const allowedServices = new Set(["postgres", "migrate", "card", "dashboard"]);
const allowedBindings = new Set<string>([executiveCardBindings.card, executiveCardBindings.dashboard]);
const approvedRuntimeEnvFiles = new Set([
  "${EXECUTIVE_CARD_ENV_FILE:-/opt/the-executive-card/shared/env/production.env}",
  "/opt/the-executive-card/shared/env/production.env"
]);

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
  let currentLongFormPort: Record<string, string> | null = null;

  function flushLongFormPort() {
    if (!currentLongFormPort) {
      return;
    }

    const host = currentLongFormPort.host_ip;
    const published = currentLongFormPort.published;
    const target = currentLongFormPort.target;
    if (host && published && target) {
      mappings.push(`${host}:${published}:${target}`);
    }
    currentLongFormPort = null;
  }

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
        flushLongFormPort();
        portsIndent = null;
        continue;
      }

      const match = line.match(/^\s*-\s*"([^"]+)"\s*$/);
      if (match?.[1]) {
        flushLongFormPort();
        mappings.push(match[1]);
        continue;
      }

      const longFormStart = line.match(/^\s*-\s+([A-Za-z_]+):\s*(.+)\s*$/);
      if (longFormStart?.[1] && longFormStart[2]) {
        flushLongFormPort();
        currentLongFormPort = {
          [longFormStart[1]]: stripYamlScalar(longFormStart[2])
        };
        continue;
      }

      const longFormEntry = line.match(/^\s+([A-Za-z_]+):\s*(.+)\s*$/);
      if (currentLongFormPort && longFormEntry?.[1] && longFormEntry[2]) {
        currentLongFormPort[longFormEntry[1]] = stripYamlScalar(longFormEntry[2]);
      }
    }
  }

  flushLongFormPort();
  return mappings;
}

function collectVolumeMounts(renderedCompose: string): string[] {
  const lines = splitLines(renderedCompose);
  const mounts: string[] = [];
  let volumesIndent: number | null = null;
  let currentLongFormVolume: Record<string, string> | null = null;

  function flushLongFormVolume() {
    if (!currentLongFormVolume) {
      return;
    }

    if (currentLongFormVolume.source && currentLongFormVolume.target) {
      mounts.push(`${currentLongFormVolume.source}:${currentLongFormVolume.target}`);
    }
    currentLongFormVolume = null;
  }

  for (const line of lines) {
    if (/^\s+volumes:\s*$/.test(line)) {
      volumesIndent = line.search(/\S/);
      continue;
    }

    if (volumesIndent !== null) {
      const currentIndent = line.search(/\S/);
      if (currentIndent === -1) {
        continue;
      }
      if (currentIndent <= volumesIndent) {
        flushLongFormVolume();
        volumesIndent = null;
        continue;
      }

      const shortForm = line.match(/^\s*-\s*([^:]+:[^#\s]+)\s*$/);
      if (shortForm?.[1]) {
        flushLongFormVolume();
        mounts.push(stripYamlScalar(shortForm[1]));
        continue;
      }

      const longFormStart = line.match(/^\s*-\s+([A-Za-z_]+):\s*(.+)\s*$/);
      if (longFormStart?.[1] && longFormStart[2]) {
        flushLongFormVolume();
        currentLongFormVolume = {
          [longFormStart[1]]: stripYamlScalar(longFormStart[2])
        };
        continue;
      }

      const longFormEntry = line.match(/^\s+([A-Za-z_]+):\s*(.+)\s*$/);
      if (currentLongFormVolume && longFormEntry?.[1] && longFormEntry[2]) {
        currentLongFormVolume[longFormEntry[1]] = stripYamlScalar(longFormEntry[2]);
      }
    }
  }

  flushLongFormVolume();
  return mounts;
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

function isTrueLike(value: string | null): boolean {
  return value !== null && ["1", "true", "yes", "on", "enabled"].includes(value.trim().toLowerCase());
}

function findEnvironmentValueInBlock(block: string[], variable: string): string | null {
  const text = block.join("\n");
  return findEnvironmentValue(text, variable);
}

function collectEnvFiles(block: string[]): string[] {
  const envFiles: string[] = [];
  let envFileIndent: number | null = null;

  for (const line of block) {
    if (/^\s+env_file:\s*$/.test(line)) {
      envFileIndent = line.search(/\S/);
      continue;
    }

    if (envFileIndent !== null) {
      const currentIndent = line.search(/\S/);
      if (currentIndent === -1) {
        continue;
      }
      if (currentIndent <= envFileIndent) {
        envFileIndent = null;
        continue;
      }

      const match = line.match(/^\s*-\s*(.+)\s*$/);
      if (match?.[1]) {
        envFiles.push(stripYamlScalar(match[1]));
      }
    }
  }

  return envFiles;
}

function hasApprovedRuntimeEnvFile(block: string[]): boolean {
  return collectEnvFiles(block).some((envFile) => approvedRuntimeEnvFiles.has(envFile));
}

function collectRuntimeEnvironmentFailures(servicesSection: string[]): string[] {
  const failures: string[] = [];

  for (const service of ["card", "dashboard"]) {
    const block = getNamedChildBlock(servicesSection, service);
    const approvedEnvFile = hasApprovedRuntimeEnvFile(block);
    const expected = [
      ["TELEPHONY_PROVIDER", "mock"],
      ["TELEPHONY_PROVIDER_MODE", "disabled"],
      ["VOICE_RUNTIME_PROVIDER", "none"]
    ] as const;

    for (const [variable, value] of expected) {
      const received = findEnvironmentValueInBlock(block, variable);
      if (received === null && approvedEnvFile) {
        continue;
      }
      if (received !== value) {
        failures.push(`${service}.${variable}=${received ?? "<missing>"}`);
      }
    }

    const falseLike = [
      "VOICE_AGENT_ENABLED",
      "LIVE_INBOUND_CALLS_ENABLED",
      "OUTBOUND_CALLS_ENABLED",
      "ALLOW_PRODUCTION_CALLS",
      "CALL_TRANSFER_ENABLED",
      "VOICE_RECORDING_DISCLOSURE_ENABLED"
    ];

    for (const variable of falseLike) {
      const received = findEnvironmentValueInBlock(block, variable);
      if (received === null && approvedEnvFile) {
        continue;
      }
      if (!isFalseLike(received)) {
        failures.push(`${service}.${variable}=${received ?? "<missing>"}`);
      }
    }

    const voiceTestMode = findEnvironmentValueInBlock(block, "VOICE_TEST_MODE");
    if (!(voiceTestMode === null && approvedEnvFile) && !isTrueLike(voiceTestMode)) {
      failures.push(`${service}.VOICE_TEST_MODE=${voiceTestMode ?? "<missing>"}`);
    }

    const humanApproval = findEnvironmentValueInBlock(block, "REQUIRE_HUMAN_APPROVAL");
    if (!(humanApproval === null && approvedEnvFile) && !isTrueLike(humanApproval)) {
      failures.push(`${service}.REQUIRE_HUMAN_APPROVAL=${humanApproval ?? "<missing>"}`);
    }
  }

  return failures;
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
  const volumeMounts = collectVolumeMounts(renderedCompose);
  const unexpectedServices = services.filter((service) => !allowedServices.has(service));
  const unexpectedBindings = portMappings.filter((binding) => !allowedBindings.has(binding));
  const runtimeEnvironmentFailures = collectRuntimeEnvironmentFailures(servicesSection);
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
      volumes.includes(executiveCardVolumeName) &&
        volumeMounts.includes(`${executiveCardVolumeName}:/var/lib/postgresql/data`),
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
    result("production-communications-disabled", runtimeEnvironmentFailures.length === 0, [
      runtimeEnvironmentFailures.length > 0
        ? `unsafe or missing runtime environment values: ${runtimeEnvironmentFailures.join(", ")}`
        : "card and dashboard runtime communication controls remain production-disabled"
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
