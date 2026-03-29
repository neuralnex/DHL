import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["typeorm", "pg", "reflect-metadata"],
  transpilePackages: ["mapbox-gl"],
};

export default nextConfig;
