import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  executiveDefaultCalendarSlots,
  executiveProfiles
} from "@bidayax/config/executives";
import {
  interactionEventTypes,
  receptionistLanguages,
  receptionistRequestTypes
} from "@bidayax/types";
import { getCardQrUrl, getCardUrl } from "../lib/routes";
import {
  getExecutiveCalendarPath,
  getExecutiveCalendarSlots,
  getExecutiveCalendarUrl
} from "../lib/calendar";
import { getExecutiveQrValue } from "../lib/qr";
import { createVCard, getVCardFilename } from "../lib/vcard";
import { getExecutiveCardMetadata } from "../lib/seo";
import { createReceptionistNotificationPayload } from "../lib/receptionist-notification";
import {
  canAttemptTransferSound,
  getTransferAnimationEnabled,
  isQrTransferUrl,
  triggerTransferHaptics
} from "../lib/transfer-feedback";
import {
  defaultTransferFeedbackSettings,
  readTransferFeedbackSettings,
  writeTransferFeedbackSettings
} from "../lib/transfer-feedback-settings";

const expectedProfiles = [
  ["ad-garner", "A.D Garner", "COO / CTO / Founder"],
  ["naimah-barnes", "Naimah J. Barnes", "CEO"],
  ["sean-hall", "Sean Hall", "Executive Management"]
] as const;

const expectedTagline =
  "Building category-defining Synthetic Intelligence for global enterprises";

class MemoryTransferFeedbackStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

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
          tagline: expectedTagline,
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
      const directUrl = new URL(getCardUrl(profile));

      expect(directUrl.searchParams.get("source")).toBeNull();
      expect(directUrl.searchParams.get("scan")).toBeNull();
      expect(getCardQrUrl(profile)).toBe(profile.qrUrl);
      expect(getExecutiveQrValue(profile)).toBe(profile.qrUrl);
      expect(new URL(profile.qrUrl).searchParams.get("source")).toBe("qr");
      expect(isQrTransferUrl(profile.qrUrl)).toBe(true);
      expect(isQrTransferUrl(`${getCardUrl(profile)}?scan=1`)).toBe(true);
      expect(isQrTransferUrl(getCardUrl(profile))).toBe(false);
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

  it("keeps executive profile data out of JSX components", () => {
    const componentFiles = [
      "src/components/ExecutiveCardTemplate.tsx",
      "src/components/ExecutiveHeader.tsx",
      "src/components/ExecutiveActionGrid.tsx",
      "src/components/ExecutiveInfoCard.tsx"
    ];

    for (const file of componentFiles) {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");

      expect(source).not.toContain("A.D Garner");
      expect(source).not.toContain("Naimah J. Barnes");
      expect(source).not.toContain("Sean Hall");
      expect(source).not.toContain("+1 (302) 330-5547");
      expect(source).not.toContain("8 The Green Ste A");
    }
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
      "qr_transfer_detected",
      "qr_transfer_success_feedback",
      "qr_transfer_failure_feedback",
      "qr_transfer_haptics_toggled",
      "qr_transfer_sound_toggled",
      "qr_transfer_animation_toggled",
      "calendar_view",
      "calendar_slot_selected",
      "calendar_request_submitted",
      "calendar_request_failed",
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

  it("keeps the production card page executive-focused without a persistent logo", () => {
    const header = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveHeader.tsx"),
      "utf8"
    );
    const template = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveCardTemplate.tsx"),
      "utf8"
    );

    expect(header).not.toContain("ExecutiveBrandMark");
    expect(header).not.toContain("executive-header-mark");
    expect(template).not.toContain("ExecutiveBrandMark");
    expect(template).not.toContain("executive-qr-sheet-mark");
  });

  it("reserves the logo mark for the splash screen", () => {
    const splash = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveCardSplash.tsx"),
      "utf8"
    );
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );

    expect(splash).toContain("ExecutiveBrandMark");
    expect(splash).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain(".executive-splash");
    expect(css).toContain(".executive-splash-mark");
    expect(css).toContain("460ms");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(splash).toContain("standardSplashDurationMs = 460");
    expect(splash).toContain("reducedMotionSplashDurationMs = 300");
  });

  it("uses a reduced executive name size", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );

    expect(css).toContain("font-size: 2rem;");
    expect(css).toContain("font-size: 2.625rem;");
    expect(css).not.toContain("font-size: 2.25rem;");
    expect(css).not.toContain("font-size: 2.875rem;");
  });

  it("routes meeting requests to the internal calendar page", () => {
    const meetingCard = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveMeetingCard.tsx"),
      "utf8"
    );

    for (const profile of executiveProfiles) {
      expect(getExecutiveCalendarPath(profile)).toBe(
        `/card/${profile.slug}/calendar`
      );
      expect(getExecutiveCalendarUrl(profile)).toBe(
        `https://theexecutivecard.online/card/${profile.slug}/calendar`
      );
    }

    expect(meetingCard).toContain("getExecutiveCalendarPath");
    expect(meetingCard).not.toContain("mailto:");
    expect(meetingCard).not.toContain("meeting_request_email");
  });

  it("uses configurable calendar slots for every executive", () => {
    expect(executiveDefaultCalendarSlots).toEqual([
      {
        label: "Tomorrow morning",
        value: "tomorrow-morning",
        timezone: "America/New_York"
      },
      {
        label: "Tomorrow afternoon",
        value: "tomorrow-afternoon",
        timezone: "America/New_York"
      },
      {
        label: "This week",
        value: "this-week",
        timezone: "America/New_York"
      },
      {
        label: "Next week",
        value: "next-week",
        timezone: "America/New_York"
      }
    ]);

    for (const profile of executiveProfiles) {
      expect(getExecutiveCalendarSlots(profile)).toBe(profile.calendarSlots);
      expect(getExecutiveCalendarSlots(profile)).toHaveLength(4);
    }
  });

  it("builds a calendar page for all production executives", () => {
    const calendarPage = readFileSync(
      resolve(process.cwd(), "app/card/[slug]/calendar/page.tsx"),
      "utf8"
    );

    expect(calendarPage).toContain("generateStaticParams");
    expect(calendarPage).toContain("ExecutiveCalendarBooking");
    expect(calendarPage).toContain("getExecutiveBySlug");
    expect(executiveProfiles.map((profile) => profile.slug)).toEqual([
      "ad-garner",
      "naimah-barnes",
      "sean-hall"
    ]);
  });

  it("submits calendar requests without a mailto fallback", () => {
    const calendarBooking = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveCalendarBooking.tsx"),
      "utf8"
    );

    expect(calendarBooking).toContain("submitReceptionistRequest");
    expect(calendarBooking).toContain("internal_request_queued");
    expect(calendarBooking).toContain("calendar_request_submitted");
    expect(calendarBooking).toContain("calendar_request_failed");
    expect(calendarBooking).not.toContain("mailto:");
  });

  it("keeps bottom actions fixed, safe-area aware, and focused", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );
    const footer = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveFooterActions.tsx"),
      "utf8"
    );

    expect(css).toContain(".executive-footer-actions");
    expect(css).toContain("position: fixed;");
    expect(css).toContain("z-index: 60;");
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("padding-bottom: var(--executive-footer-clearance);");
    expect(css).toContain("min-height: 2.75rem;");
    expect(footer).toContain("QR");
    expect(footer).toContain("Download");
    expect(footer).toContain("Share");
  });

  it("keeps the receptionist form modal-gated by default", () => {
    const receptionistCard = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveReceptionistCard.tsx"),
      "utf8"
    );
    const launcherIndex = receptionistCard.indexOf("Request Callback");
    const conditionalIndex = receptionistCard.indexOf("{isOpen ?");
    const formIndex = receptionistCard.indexOf("<ReceptionistRequestForm");

    expect(receptionistCard).toContain("setIsOpen(true)");
    expect(launcherIndex).toBeGreaterThan(-1);
    expect(conditionalIndex).toBeGreaterThan(launcherIndex);
    expect(formIndex).toBeGreaterThan(conditionalIndex);
  });


  it("offers phone, text chat, voice chat, and form receptionist modes", () => {
    const receptionistCard = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveReceptionistCard.tsx"),
      "utf8"
    );
    const textChat = readFileSync(
      resolve(process.cwd(), "src/components/ReceptionistTextChat.tsx"),
      "utf8"
    );
    const voiceChat = readFileSync(
      resolve(process.cwd(), "src/components/ReceptionistVoiceChat.tsx"),
      "utf8"
    );

    expect(receptionistCard).toContain("Call");
    expect(receptionistCard).toContain("Message");
    expect(receptionistCard).toContain("Request Callback");
    expect(receptionistCard).toContain("Text Chat");
    expect(receptionistCard).toContain("Voice Chat");
    expect(receptionistCard).toContain("defaultRequestTypeOverride=\"request_callback\"");
    expect(textChat).toContain("/api/receptionist/chat");
    expect(voiceChat).toContain("/api/receptionist/voice-chat");
    expect(voiceChat).toContain("Live realtime providers remain disabled");
  });
  it("keeps the receptionist workflow routes available", () => {
    const routePaths = [
      "app/api/receptionist/request/route.ts",
      "app/api/receptionist/chat/route.ts",
      "app/api/receptionist/voice-chat/route.ts",
      "app/api/receptionist/inbound-call/route.ts",
      "app/api/receptionist/callback/route.ts",
      "app/api/receptionist/calendar-request/route.ts"
    ];

    for (const routePath of routePaths) {
      expect(existsSync(resolve(process.cwd(), routePath))).toBe(true);
    }

    const requestRoute = readFileSync(
      resolve(process.cwd(), "app/api/receptionist/request/route.ts"),
      "utf8"
    );
    const handler = readFileSync(
      resolve(process.cwd(), "src/lib/receptionist-route-handler.ts"),
      "utf8"
    );

    expect(requestRoute).toContain("handleReceptionistRequestRoute");
    expect(handler).toContain("processReceptionistWorkflowRequest");
    expect(handler).toContain("consent: z.literal(true)");
    expect(handler).toContain("callbackWorkflow");
    expect(handler).toContain("Callback queued pending voice provider configuration.");
    expect(handler).toContain("receptionist_request_failed");
    expect(handler).toContain("chat_message");
    expect(handler).toContain("voice_chat");
  });

  it("does not claim live autonomous calling without provider configuration", () => {
    const receptionistCard = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveReceptionistCard.tsx"),
      "utf8"
    );
    const requestRoute = readFileSync(
      resolve(process.cwd(), "app/api/receptionist/inbound-call/route.ts"),
      "utf8"
    );

    expect(receptionistCard).toContain("Polyglot Receptionist™");
    expect(receptionistCard).not.toContain("live autonomous calling");
    expect(requestRoute).toContain("normalizeInboundCallWebhook");
    expect(requestRoute).not.toContain("sendCall");
  });
  it("uses compact receptionist sheet and form layout classes", () => {
    const receptionistCard = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveReceptionistCard.tsx"),
      "utf8"
    );
    const receptionistForm = readFileSync(
      resolve(process.cwd(), "src/components/ReceptionistRequestForm.tsx"),
      "utf8"
    );
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );

    expect(receptionistCard).toContain("executive-receptionist-sheet");
    expect(receptionistForm).toContain("receptionist-form-compact");
    expect(css).toContain(".executive-receptionist-sheet");
    expect(css).toContain(".receptionist-form");
    expect(css).toContain(".receptionist-form-compact");
    expect(css).toContain("max-height: calc(");
    expect(css).toContain("margin-bottom: 0;");
    expect(css).toContain("padding-inline: 0.125rem;");
  });

  it("wires receptionist request submission states to the API response", () => {
    const receptionistForm = readFileSync(
      resolve(process.cwd(), "src/components/ReceptionistRequestForm.tsx"),
      "utf8"
    );
    const receptionistClient = readFileSync(
      resolve(process.cwd(), "src/lib/receptionist-client.ts"),
      "utf8"
    );

    expect(receptionistForm).toContain("onSubmit={handleSubmit}");
    expect(receptionistForm).toContain("aria-busy={status === \"submitting\"}");
    expect(receptionistForm).toContain("Submitting...");
    expect(receptionistForm).toContain("Request submitted. The receptionist will follow up shortly.");
    expect(receptionistForm).toContain("event.currentTarget.reset();");
    expect(receptionistClient).toContain("!response.ok");
    expect(receptionistClient).toContain("invalid_server_response");
  });

  it("protects mobile viewport balance and unclipped receptionist inputs", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );

    expect(css).toContain("min-height: 100dvh;");
    expect(css).toContain("width: min(40rem, calc(100% - (var(--bx-space-4) * 2)))");
    expect(css).toContain("overflow-x: visible;");
    expect(css).toContain("border: 1px solid color-mix");
    expect(css).toContain("box-shadow:");
    expect(css).toContain("min-height: 2.75rem;");
  });

  it("hides visible scrollbars while preserving overflow when needed", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );

    expect(css).toContain("scrollbar-width: none;");
    expect(css).toContain("-ms-overflow-style: none;");
    expect(css).toContain("*::-webkit-scrollbar");
    expect(css).toContain("overflow: auto;");
  });

  it("applies horizontal drift guards across card surfaces", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );

    expect(css).toContain("max-width: 100%;");
    expect(css).toContain("overflow-x: hidden;");
    expect(css).toContain("min-width: 0;");
    expect(css).toContain("overflow-wrap: anywhere;");
    expect(css).toContain("width: min(40rem, calc(100% - (var(--bx-space-4) * 2)))");
  });

  it("keeps fixed navigation padding bounded to the token scale", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/styles/card.css"),
      "utf8"
    );

    expect(css).toContain("+ var(--bx-space-8)");
    expect(css).toContain("+ var(--bx-space-6)");
    expect(css).not.toContain("var(--bx-space-8)\n      + var(--bx-space-8)\n      + var(--bx-space-8)");
  });

  it("uses the approved production tagline for all cards", () => {
    expect(executiveProfiles.map((profile) => profile.tagline)).toEqual([
      expectedTagline,
      expectedTagline,
      expectedTagline
    ]);
  });

  it("mounts QR transfer feedback for QR-marked card routes", () => {
    const template = readFileSync(
      resolve(process.cwd(), "src/components/ExecutiveCardTemplate.tsx"),
      "utf8"
    );
    const feedback = readFileSync(
      resolve(process.cwd(), "src/components/QRTransferFeedback.tsx"),
      "utf8"
    );

    expect(template).toContain("defaultSettings={qrFeedbackSettings}");
    expect(template).toContain("executive={executive}");
    expect(feedback).toContain("Executive Card received");
    expect(feedback).toContain("qr_transfer_detected");
    expect(feedback).toContain("qr_transfer_success_feedback");
  });

  it("does not crash when receiver haptics are unavailable", () => {
    expect(
      triggerTransferHaptics(defaultTransferFeedbackSettings, {}, "success")
    ).toBe(false);
  });

  it("uses receiver feedback settings with safe production defaults", () => {
    expect(defaultTransferFeedbackSettings).toEqual({
      hapticsEnabled: true,
      soundEnabled: false,
      animationEnabled: true
    });
    expect(readTransferFeedbackSettings(null)).toEqual(
      defaultTransferFeedbackSettings
    );
  });

  it("persists QR transfer feedback setting toggles", () => {
    const storage = new MemoryTransferFeedbackStorage();

    writeTransferFeedbackSettings(
      {
        hapticsEnabled: false,
        soundEnabled: true,
        animationEnabled: false
      },
      storage
    );

    expect(readTransferFeedbackSettings(storage)).toEqual({
      hapticsEnabled: false,
      soundEnabled: true,
      animationEnabled: false
    });
  });

  it("gates transfer sound behind the sound setting", () => {
    expect(canAttemptTransferSound(defaultTransferFeedbackSettings)).toBe(false);
    expect(
      canAttemptTransferSound({
        ...defaultTransferFeedbackSettings,
        soundEnabled: true
      })
    ).toBe(true);
  });

  it("disables transfer animation when reduced motion is requested", () => {
    expect(getTransferAnimationEnabled(defaultTransferFeedbackSettings, true)).toBe(
      false
    );
    expect(getTransferAnimationEnabled(defaultTransferFeedbackSettings, false)).toBe(
      true
    );
  });

  it("contains a safe invalid-route transfer feedback state", () => {
    const feedback = readFileSync(
      resolve(process.cwd(), "src/components/QRTransferFeedback.tsx"),
      "utf8"
    );

    expect(feedback).toContain("Executive Card unavailable");
    expect(feedback).toContain("qr_transfer_failure_feedback");
  });

  it("documents receiver-side QR feedback limitations without sender-side claims", () => {
    const qrFeedbackDocs = readFileSync(
      resolve(process.cwd(), "../../docs/QR_TRANSFER_FEEDBACK_SYSTEM.md"),
      "utf8"
    );

    expect(qrFeedbackDocs).toContain("receiver device only");
    expect(qrFeedbackDocs).toContain("active paired web session or native bridge");
    expect(qrFeedbackDocs).not.toContain(
      "both sender and receiver devices receive haptics"
    );
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
