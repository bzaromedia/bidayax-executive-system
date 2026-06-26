import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { executives, getExecutiveBySlug } from "@/data/executives";
import { getCardUrl } from "@/lib/routes";
import { CardShell } from "@/components/CardShell";
import { ExecutiveCard } from "@/components/ExecutiveCard";

type CardPageProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

export function generateStaticParams() {
  return executives.map((executive) => ({
    slug: executive.slug
  }));
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    return {
      title: "Executive card not found"
    };
  }

  return {
    title: `${executive.name} | BidayaX LLC`,
    description: `${executive.name}, ${executive.title} at BidayaX LLC.`,
    alternates: {
      canonical: getCardUrl(executive)
    }
  };
}

export default async function ExecutiveCardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    notFound();
  }

  return (
    <main>
      <CardShell>
        <ExecutiveCard executive={executive} />
      </CardShell>
    </main>
  );
}
