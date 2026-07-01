import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { notFound } from "next/navigation";
import { getExecutiveBySlug } from "@/data/executives";

export const runtime = "nodejs";

type DownloadRouteProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

function findDownloadZip(slug: string) {
  const relativeZipPath = ["downloads", "executive-cards", `${slug}-executive-card.zip`];
  const candidates = [
    resolve(process.cwd(), ...relativeZipPath),
    resolve(process.cwd(), "..", "..", ...relativeZipPath)
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

export async function GET(_request: Request, { params }: DownloadRouteProps) {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    notFound();
  }

  const zipPath = findDownloadZip(executive.slug);

  if (!zipPath) {
    return Response.json(
      {
        action: "Run pnpm cards:downloads before requesting this internal package.",
        code: "EXECUTIVE_CARD_DOWNLOAD_NOT_GENERATED",
        slug: executive.slug,
        status: "unavailable"
      },
      {
        status: 503,
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  }

  const zip = await readFile(zipPath);

  return new Response(zip, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="${executive.slug}-executive-card.zip"`,
      "content-length": zip.byteLength.toString(),
      "content-type": "application/zip"
    }
  });
}
