import { notFound } from "next/navigation";
import { getExecutiveBySlug } from "@/data/executives";
import { createVCard } from "@/lib/vcard";

type VCardRouteProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

export async function GET(_request: Request, { params }: VCardRouteProps) {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    notFound();
  }

  return new Response(createVCard(executive), {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-disposition": `attachment; filename="${executive.vcardFileName}"`,
      "content-type": "text/vcard; charset=utf-8"
    }
  });
}
