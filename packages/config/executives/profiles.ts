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
  readonly calendarUrl?: string;
  readonly tagline: string;
  readonly bio: string;
  readonly qrUrl: string;
  readonly vcardFileName: string;
  readonly theme: "executive-black-gold";
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
  "Building Trusted Intelligence For Modern Enterprises";

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
    qrUrl: `${cardUrl("ad-garner")}?entry=qr`,
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
    qrUrl: `${cardUrl("naimah-barnes")}?entry=qr`,
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
    qrUrl: `${cardUrl("sean-hall")}?entry=qr`,
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
