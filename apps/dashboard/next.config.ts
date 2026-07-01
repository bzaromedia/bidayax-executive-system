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
  transpilePackages: ["@bidayax/config", "@bidayax/tokens", "@bidayax/types", "@bidayax/ui"]
};

export default nextConfig;
