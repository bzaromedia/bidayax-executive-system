import type { ExecutiveSlug } from "@bidayax/types";

export type ExecutiveProfile = {
  readonly slug: ExecutiveSlug;
  readonly name: string;
  readonly title: string;
  readonly organization: "BidayaX LLC";
  readonly address: {
    readonly street: string;
    readonly city: string;
    readonly region: string;
    readonly postalCode: string;
    readonly country: string;
  };
  readonly phone: string;
  readonly email: string;
  readonly website: string;
};

const sharedContact = {
  organization: "BidayaX LLC",
  address: {
    street: "8 The Green Ste A",
    city: "Dover",
    region: "DE",
    postalCode: "19901",
    country: "US"
  },
  phone: "+1 (302) 330-5547",
  email: "contact@bidayax.com",
  website: "https://bidayax.com"
} as const;

export const executives = [
  {
    slug: "ad-garner",
    name: "A.D Garner",
    title: "COO / CTO / Founder",
    ...sharedContact
  },
  {
    slug: "naimah-barnes",
    name: "Naimah J. Barnes",
    title: "CEO",
    ...sharedContact
  },
  {
    slug: "sean-hall",
    name: "Sean Hall",
    title: "EXEC MNT / Management",
    ...sharedContact
  }
] as const satisfies readonly ExecutiveProfile[];

export function getExecutiveBySlug(slug: string) {
  return executives.find((executive) => executive.slug === slug);
}
