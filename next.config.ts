import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flavio-celulares.vercel.app',
      },
    ],
  },
};

export default nextConfig;
