import type { NextConfig } from "next";
import { getSecurityHeaders } from "@bidayax/config";

const nextConfig: NextConfig = {
  distDir: ".next-build",
  async headers() {
    return [
      {
        headers: [...getSecurityHeaders()],
        source: "/:path*"
      }
    ];
  },
  transpilePackages: [
    "@bidayax/card-customization",
    "@bidayax/communications",
    "@bidayax/config",
    "@bidayax/identity",
    "@bidayax/improvement-engine",
    "@bidayax/polyglot-receptionist",
    "@bidayax/settings",
    "@bidayax/telemetry",
    "@bidayax/telephony",
    "@bidayax/tokens",
    "@bidayax/trust",
    "@bidayax/types",
    "@bidayax/ui"
  ]
};

export default nextConfig;
