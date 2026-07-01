import { describe, expect, it } from "vitest";
import { executiveProfiles } from "@bidayax/config/executives";
import { interactionEventTypes } from "@bidayax/types";
import { getCardUrl } from "../lib/routes";
import { getExecutiveQrValue } from "../lib/qr";
import { createVCard, getVCardFilename } from "../lib/vcard";
import { getExecutiveCardMetadata } from "../lib/seo";

const expectedProfiles = [
  ["ad-garner", "A.D Garner", "COO / CTO / Founder"],
  ["naimah-barnes", "Naimah J. Barnes", "CEO"],
  ["sean-hall", "Sean Hall", "Executive Management"]
] as const;

describe("production executive cards", () => {
  it("defines all three production profiles", () => {
    expect(executiveProfiles).toHaveLength(3);

    for (const [slug, displayName, role] of expectedProfiles) {
      expect(executiveProfiles).toContainEqual(
        expect.objectContaining({
          address: "8 The Green Ste A, Dover, DE 19901",
          company: "BidayaX LLC",
          displayName,
          email: "contact@bidayax.com",
          phone: "+1 (302) 330-5547",
          role,
          slug,
          theme: "executive-black-gold",
          website: "https://theexecutivecard.online"
        })
      );
    }
  });

  it("uses unique production slugs", () => {
    const slugs = executiveProfiles.map((profile) => profile.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual(["ad-garner", "naimah-barnes", "sean-hall"]);
  });

  it("generates valid production URLs and QR URLs", () => {
    for (const profile of executiveProfiles) {
      expect(getCardUrl(profile)).toBe(
        `https://theexecutivecard.online/card/${profile.slug}`
      );
      expect(getExecutiveQrValue(profile)).toBe(profile.qrUrl);
      expect(new URL(profile.qrUrl).searchParams.get("entry")).toBe("qr");
    }
  });

  it("generates valid vCard output", () => {
    for (const profile of executiveProfiles) {
      const vcard = createVCard(profile);

      expect(vcard).toContain("BEGIN:VCARD");
      expect(vcard).toContain("VERSION:3.0");
      expect(vcard).toContain(`FN:${profile.displayName}`);
      expect(vcard).toContain(`TITLE:${profile.role}`);
      expect(vcard).toContain("ORG:BidayaX LLC");
      expect(vcard).toContain("TEL;TYPE=WORK,VOICE:+1 (302) 330-5547");
      expect(vcard).toContain("EMAIL;TYPE=WORK:contact@bidayax.com");
      expect(vcard).toContain("URL:https://theexecutivecard.online");
      expect(vcard).toContain("END:VCARD");
      expect(getVCardFilename(profile)).toBe(`${profile.slug}.vcf`);
    }
  });

  it("does not contain non-production profile data", () => {
    const serialized = JSON.stringify(executiveProfiles).toLowerCase();

    expect(serialized).not.toContain("lorem");
    expect(serialized).not.toContain("example.com");
    expect(serialized).not.toContain("placeholder");
    expect(serialized).not.toContain("mock");
  });

  it("supports all card event names", () => {
    expect(interactionEventTypes).toEqual([
      "qr_scan",
      "card_view",
      "vcard_download",
      "call_click",
      "email_click",
      "website_click",
      "share_click"
    ]);
  });

  it("creates public card metadata", () => {
    for (const profile of executiveProfiles) {
      const metadata = getExecutiveCardMetadata(profile);

      expect(metadata.title).toBe(`${profile.displayName} | The Executive Card`);
      expect(metadata.description).toContain(profile.role);
      expect(metadata.alternates?.canonical).toBe(getCardUrl(profile));
      expect(metadata.openGraph?.url).toBe(getCardUrl(profile));
    }
  });
});
