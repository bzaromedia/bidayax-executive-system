import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { executives, getExecutiveBySlug } from "@/data/executives";
import { CardShell } from "@/components/CardShell";
import { ExecutiveCalendarBooking } from "@/components/ExecutiveCalendarBooking";
import { getExecutiveCalendarUrl } from "@/lib/calendar";

type CalendarPageProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

export function generateStaticParams() {
  return executives.map((executive) => ({
    slug: executive.slug
  }));
}

export async function generateMetadata({
  params
}: CalendarPageProps): Promise<Metadata> {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    return {
      title: "Calendar not found"
    };
  }

  return {
    alternates: {
      canonical: getExecutiveCalendarUrl(executive)
    },
    description: `Request a meeting with ${executive.displayName} through The Executive Card internal scheduling workflow.`,
    openGraph: {
      description: `Request a meeting with ${executive.displayName} through The Executive Card internal scheduling workflow.`,
      title: `Book a Meeting with ${executive.displayName}`,
      type: "website",
      url: getExecutiveCalendarUrl(executive)
    },
    title: `Book a Meeting with ${executive.displayName} | The Executive Card`
  };
}

export default async function ExecutiveCalendarPage({
  params
}: CalendarPageProps) {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    notFound();
  }

  return (
    <main>
      <CardShell>
        <ExecutiveCalendarBooking executive={executive} />
      </CardShell>
    </main>
  );
}
