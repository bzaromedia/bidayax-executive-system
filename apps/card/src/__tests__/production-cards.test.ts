import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { executiveProfiles } from "@bidayax/config/executives";
import {
  interactionEventTypes,
  receptionistLanguages,
  receptionistRequestTypes
} from "@bidayax/types";
import { getCardUrl } from "../lib/routes";
import { getExecutiveQrValue } from "../lib/qr";
import { createVCard, getVCardFilename } from "../lib/vcard";
import { getExecutiveCardMetadata } from "../lib/seo";
import { createReceptionistNotificationPayload } from "../lib/receptionist-notification";

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
          address: "8 The Green Ste A\nDover, DE 19901",
          addressLine1: "8 The Green Ste A",
          addressLine2: "Dover, DE 19901",
          company: "BidayaX LLC",
          displayName,
          email: "contact@theexecutivecard.com",
          phone: "+1 (302) 330-5547",
          role,
          slug,
          tagline: "Building Trusted Intelligence For Modern Enterprises",
          theme: "executive-black-gold",
          website: "https://bidayax.com"
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
      expect(vcard).toContain("EMAIL;TYPE=WORK:contact@theexecutivecard.com");
      expect(vcard).toContain("URL:https://bidayax.com");
      expect(vcard).toContain("8 The Green Ste A\\nDover\\, DE 19901");
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
      "share_click",
      "receptionist_request_started",
      "receptionist_request_submitted",
      "receptionist_request_failed",
      "receptionist_meeting_requested",
      "receptionist_callback_requested",
      "receptionist_lead_qualified"
    ]);
  });

  it("supports the production receptionist request taxonomy", () => {
    expect(receptionistRequestTypes).toEqual([
      "schedule_meeting",
      "route_message",
      "request_callback",
      "qualify_lead",
      "general_inquiry",
      "partnership_request",
      "support_request"
    ]);
    expect(receptionistLanguages).toEqual([
      "English",
      "Spanish",
      "Arabic",
      "French",
      "Mandarin",
      "Urdu",
      "Hindi"
    ]);
  });

  it("creates safe receptionist notification payloads", () => {
    const profile = executiveProfiles.find((item) => item.slug === "ad-garner");

    expect(profile).toBeDefined();

    if (!profile) {
      return;
    }

    const notification = createReceptionistNotificationPayload(
      {
        consent: true,
        email: "owner@company.test",
        executiveSlug: profile.slug,
        message: "Please schedule a strategic planning call next week.",
        name: "Business Owner",
        preferredLanguage: "English",
        requestType: "schedule_meeting"
      },
      profile.displayName
    );

    expect(notification.to).toBe("contact@theexecutivecard.com");
    expect(notification.subject).toBe(
      "[The Executive Card] Receptionist Request - A.D Garner - Schedule Meeting"
    );
    expect(notification.body).toContain("Business Owner");
    expect(notification.body).toContain("Please schedule");
  });

  it("does not use the old card presentation shell", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );
    const template = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveCardTemplate.tsx"),
      "utf8"
    );

    expect(css).not.toContain("executive-phone-shell");
    expect(css).not.toContain("executive-phone-glass");
    expect(css).not.toContain("executive-brand-card");
    expect(template).not.toContain("executive-phone-shell");
    expect(template).not.toContain("executive-brand-card");
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
