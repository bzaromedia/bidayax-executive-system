import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { executives, getExecutiveBySlug } from "@/data/executives";
import { CardShell } from "@/components/CardShell";
import { ExecutiveCardProfile } from "@/components/ExecutiveCardProfile";
import {
  getExecutiveCardMetadata,
  getExecutiveCardStructuredData
} from "@/lib/seo";

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

  return getExecutiveCardMetadata(executive);
}

export default async function ExecutiveCardPage({ params }: CardPageProps) {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    notFound();
  }

  return (
    <main>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getExecutiveCardStructuredData(executive))
        }}
      />
      <CardShell>
        <ExecutiveCardProfile executive={executive} />
      </CardShell>
    </main>
  );
}
