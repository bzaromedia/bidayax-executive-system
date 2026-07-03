import type { ExecutiveSlug } from "@bidayax/types";

export type ExecutiveProfile = {
  readonly id: string;
  readonly slug: ExecutiveSlug;
  readonly displayName: string;
  readonly role: string;
  readonly company: "BidayaX LLC";
  readonly address: string;
  readonly addressLine1: string;
  readonly addressLine2: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly calendarSlots?: readonly ExecutiveCalendarSlot[];
  readonly tagline: string;
  readonly bio: string;
  readonly qrUrl: string;
  readonly vcardFileName: string;
  readonly theme: "executive-black-gold";
};

export type ExecutiveCalendarSlot = {
  readonly label: string;
  readonly value: string;
  readonly timezone: string;
};

export const executiveCardBaseUrl = "https://theexecutivecard.online";
export const executiveCompany = "BidayaX LLC";
export const executiveSharedAddressLine1 = "8 The Green Ste A";
export const executiveSharedAddressLine2 = "Dover, DE 19901";
export const executiveSharedAddress = `${executiveSharedAddressLine1}\n${executiveSharedAddressLine2}`;
export const executiveSharedPhone = "+1 (302) 330-5547";
export const executiveSharedEmail = "contact@theexecutivecard.com";
export const executiveSharedWebsite = "https://bidayax.com";
export const executiveSharedTagline =
  "Building category-defining Synthetic Intelligence for global enterprises";

export const executiveDefaultCalendarSlots = [
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
] as const satisfies readonly ExecutiveCalendarSlot[];

function cardUrl(slug: ExecutiveSlug) {
  return `${executiveCardBaseUrl}/card/${slug}`;
}

export const executiveProfiles = [
  {
    id: "exec-ad-garner",
    slug: "ad-garner",
    displayName: "A.D Garner",
    role: "COO / CTO / Founder",
    company: executiveCompany,
    address: executiveSharedAddress,
    addressLine1: executiveSharedAddressLine1,
    addressLine2: executiveSharedAddressLine2,
    phone: executiveSharedPhone,
    email: executiveSharedEmail,
    website: executiveSharedWebsite,
    tagline: executiveSharedTagline,
    bio: "A.D Garner leads operational and technology execution for BidayaX LLC.",
    calendarSlots: executiveDefaultCalendarSlots,
    qrUrl: `${cardUrl("ad-garner")}?source=qr`,
    vcardFileName: "ad-garner.vcf",
    theme: "executive-black-gold"
  },
  {
    id: "exec-naimah-barnes",
    slug: "naimah-barnes",
    displayName: "Naimah J. Barnes",
    role: "CEO",
    company: executiveCompany,
    address: executiveSharedAddress,
    addressLine1: executiveSharedAddressLine1,
    addressLine2: executiveSharedAddressLine2,
    phone: executiveSharedPhone,
    email: executiveSharedEmail,
    website: executiveSharedWebsite,
    tagline: executiveSharedTagline,
    bio: "Naimah J. Barnes leads BidayaX LLC and the business direction.",
    calendarSlots: executiveDefaultCalendarSlots,
    qrUrl: `${cardUrl("naimah-barnes")}?source=qr`,
    vcardFileName: "naimah-barnes.vcf",
    theme: "executive-black-gold"
  },
  {
    id: "exec-sean-hall",
    slug: "sean-hall",
    displayName: "Sean Hall",
    role: "Executive Management",
    company: executiveCompany,
    address: executiveSharedAddress,
    addressLine1: executiveSharedAddressLine1,
    addressLine2: executiveSharedAddressLine2,
    phone: executiveSharedPhone,
    email: executiveSharedEmail,
    website: executiveSharedWebsite,
    tagline: executiveSharedTagline,
    bio: "Sean Hall supports executive management for BidayaX LLC.",
    calendarSlots: executiveDefaultCalendarSlots,
    qrUrl: `${cardUrl("sean-hall")}?source=qr`,
    vcardFileName: "sean-hall.vcf",
    theme: "executive-black-gold"
  }
] as const satisfies readonly ExecutiveProfile[];

export function getExecutiveProfileBySlug(slug: string) {
  return executiveProfiles.find((profile) => profile.slug === slug);
}

export function getExecutiveCardUrl(profile: Pick<ExecutiveProfile, "slug">) {
  return cardUrl(profile.slug);
}
