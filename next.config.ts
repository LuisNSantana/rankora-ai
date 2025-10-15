import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "chartjs-node-canvas",
    "canvas",
    "@sparticuz/chromium",
  ],
};

export default nextConfig;
