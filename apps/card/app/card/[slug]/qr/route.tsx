import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";
import { QRCodeSVG } from "qrcode.react";
import { primitiveColors } from "@bidayax/tokens";
import { getExecutiveBySlug } from "@/data/executives";
import { getExecutiveQrValue } from "@/lib/qr";

type QrRouteProps = {
  readonly params: Promise<{
    readonly slug: string;
  }>;
};

export async function GET(_request: Request, { params }: QrRouteProps) {
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
          backgroundColor: primitiveColors.neutral.pureWhite,
          display: "flex",
          height: "640px",
          justifyContent: "center",
          width: "640px"
        }}
      >
        <QRCodeSVG
          bgColor={primitiveColors.neutral.pureWhite}
          fgColor={primitiveColors.black.brand}
          level="H"
          marginSize={4}
          size={560}
          title={`QR link for ${executive.displayName}`}
          value={getExecutiveQrValue(executive)}
        />
      </div>
    ),
    {
      headers: {
        "cache-control": "public, max-age=3600"
      },
      height: 640,
      width: 640
    }
  );
}
