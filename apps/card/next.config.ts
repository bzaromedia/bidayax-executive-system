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
  reactStrictMode: true,
  transpilePackages: ["@bidayax/config", "@bidayax/types"]
};

export default nextConfig;
