import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Settings can submit a logo, favicon, and hero image together. Each image
    // is validated at 10 MB in saveUploadedImage; this leaves multipart room.
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
