import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/student/:srNumber",
        destination: "/students/:srNumber",
        permanent: false,
      },
      {
        source: "/student/:srNumber/:path*",
        destination: "/students/:srNumber/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
