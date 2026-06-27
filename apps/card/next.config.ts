import type { NextConfig } from "next";
import { getSecurityHeaders } from "@bidayax/config";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        headers: [...getSecurityHeaders()],
        source: "/:path*"
      }
    ];
  },
  reactStrictMode: true,
  transpilePackages: ["@bidayax/config"]
};

export default nextConfig;
