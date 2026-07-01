import type { ExecutiveProfile } from "@bidayax/config/executives";

function escapeVCardValue(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll("\n", "\\n");
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  const family = parts.length > 1 ? parts.at(-1) ?? "" : "";
  const given = parts.slice(0, -1).join(" ") || name;

  return {
    family: escapeVCardValue(family),
    given: escapeVCardValue(given)
  };
}

export function createVCard(executive: ExecutiveProfile) {
  const { family, given } = splitName(executive.displayName);

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${family};${given};;;`,
    `FN:${escapeVCardValue(executive.displayName)}`,
    `TITLE:${escapeVCardValue(executive.role)}`,
    `ORG:${escapeVCardValue(executive.company)}`,
    `TEL;TYPE=WORK,VOICE:${escapeVCardValue(executive.phone)}`,
    `EMAIL;TYPE=WORK:${escapeVCardValue(executive.email)}`,
    `URL:${escapeVCardValue(executive.website)}`,
    `ADR;TYPE=WORK:;;${escapeVCardValue(executive.address)};;;;`,
    `NOTE:${escapeVCardValue(executive.tagline)}`,
    "END:VCARD"
  ].join("\r\n");
}

export function createVCardDataUri(executive: ExecutiveProfile) {
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(createVCard(executive))}`;
}

export function getVCardFilename(executive: ExecutiveProfile) {
  return executive.vcardFileName;
}
