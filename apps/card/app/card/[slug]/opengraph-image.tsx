import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { primitiveColors } from "@bidayax/tokens";
import { getExecutiveBySlug } from "@/data/executives";

export const alt = "The Executive Card profile";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630
};

type OpenGraphImageProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { slug } = await params;
  const executive = getExecutiveBySlug(slug);

  if (!executive) {
    notFound();
  }

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: primitiveColors.black.brand,
          color: primitiveColors.neutral.softWhite,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          width: "100%"
        }}
      >
        <div
          style={{
            border: `2px solid ${primitiveColors.gold.brand}`,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            padding: 56,
            width: "100%"
          }}
        >
          <div style={{ color: primitiveColors.gold.brand, fontSize: 30, letterSpacing: 6 }}>
            THE EXECUTIVE CARD
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ fontSize: 88, fontWeight: 700 }}>
              {executive.displayName}
            </div>
            <div style={{ color: primitiveColors.gold.brand, fontSize: 38 }}>
              {executive.role}
            </div>
            <div style={{ color: primitiveColors.neutral.mutedGray, fontSize: 30 }}>
              {executive.company}
            </div>
          </div>
          <div style={{ color: primitiveColors.neutral.softWhite, fontSize: 28 }}>
            theexecutivecard.online/card/{executive.slug}
          </div>
        </div>
      </div>
    ),
    size
  );
}
