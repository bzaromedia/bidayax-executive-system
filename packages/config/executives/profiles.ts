import type { ExecutiveSlug } from "@bidayax/types";

export type ExecutiveProfile = {
  readonly id: string;
  readonly slug: ExecutiveSlug;
  readonly displayName: string;
  readonly role: string;
  readonly company: "BidayaX LLC";
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly website: string;
  readonly tagline: string;
  readonly bio: string;
  readonly qrUrl: string;
  readonly vcardFileName: string;
  readonly theme: "executive-black-gold";
};

export const executiveCardBaseUrl = "https://theexecutivecard.online";
export const executiveCompany = "BidayaX LLC";
export const executiveSharedAddress = "8 The Green Ste A, Dover, DE 19901";
export const executiveSharedPhone = "+1 (302) 330-5547";
export const executiveSharedEmail = "contact@bidayax.com";
export const executiveSharedWebsite = "https://theexecutivecard.online";

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
    phone: executiveSharedPhone,
    email: executiveSharedEmail,
    website: executiveSharedWebsite,
    tagline: "Executive identity, operations, and technology leadership.",
    bio: "A.D Garner leads operational and technology execution for BidayaX LLC through The Executive Card.",
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
    phone: executiveSharedPhone,
    email: executiveSharedEmail,
    website: executiveSharedWebsite,
    tagline: "Executive leadership for identity-driven business relationships.",
    bio: "Naimah J. Barnes leads BidayaX LLC and the business direction for The Executive Card.",
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
    phone: executiveSharedPhone,
    email: executiveSharedEmail,
    website: executiveSharedWebsite,
    tagline: "Executive management for trusted relationship intelligence.",
    bio: "Sean Hall supports executive management for BidayaX LLC and The Executive Card.",
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
