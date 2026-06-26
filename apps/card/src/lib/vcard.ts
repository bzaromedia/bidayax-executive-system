import type { ExecutiveProfile } from "../data/executives";

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
  const { family, given } = splitName(executive.name);
  const address = executive.address;

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${family};${given};;;`,
    `FN:${escapeVCardValue(executive.name)}`,
    `TITLE:${escapeVCardValue(executive.title)}`,
    `ORG:${escapeVCardValue(executive.organization)}`,
    `TEL;TYPE=WORK,VOICE:${escapeVCardValue(executive.phone)}`,
    `EMAIL;TYPE=WORK:${escapeVCardValue(executive.email)}`,
    `URL:${escapeVCardValue(executive.website)}`,
    `ADR;TYPE=WORK:;;${escapeVCardValue(address.street)};${escapeVCardValue(
      address.city
    )};${escapeVCardValue(address.region)};${escapeVCardValue(
      address.postalCode
    )};${escapeVCardValue(address.country)}`,
    "END:VCARD"
  ].join("\r\n");
}

export function createVCardDataUri(executive: ExecutiveProfile) {
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(createVCard(executive))}`;
}

export function getVCardFilename(executive: ExecutiveProfile) {
  return `${executive.slug}.vcf`;
}
