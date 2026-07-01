import type { Metadata } from "next";
import type { ExecutiveProfile } from "@bidayax/config/executives";
import { getCardUrl } from "./routes";

export function getExecutiveCardMetadata(executive: ExecutiveProfile): Metadata {
  const canonical = getCardUrl(executive);
  const title = `${executive.displayName} | The Executive Card`;
  const description = `${executive.displayName}, ${executive.role} at ${executive.company}.`;

  return {
    title,
    description,
    alternates: {
      canonical
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonical,
      siteName: "The Executive Card",
      images: [
        {
          url: `${canonical}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${executive.displayName} executive card`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${canonical}/opengraph-image`]
    }
  };
}

export function getExecutiveCardStructuredData(executive: ExecutiveProfile) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: executive.displayName,
    jobTitle: executive.role,
    worksFor: {
      "@type": "Organization",
      name: executive.company
    },
    email: executive.email,
    telephone: executive.phone,
    url: getCardUrl(executive),
    address: {
      "@type": "PostalAddress",
      streetAddress: "8 The Green Ste A",
      addressLocality: "Dover",
      addressRegion: "DE",
      postalCode: "19901",
      addressCountry: "US"
    }
  };
}
