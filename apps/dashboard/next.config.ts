import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bidayax/tokens", "@bidayax/types", "@bidayax/ui"]
};

export default nextConfig;
