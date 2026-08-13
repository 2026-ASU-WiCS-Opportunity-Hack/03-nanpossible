import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL
    ? ".next"
    : process.env.NODE_ENV === "development"
      ? ".next.nosync/dev"
      : ".next.nosync/prod",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wial.org",
      },
      {
        protocol: "https",
        hostname: "www.wial.org",
      },
      {
        protocol: "https",
        hostname: "images.credly.com",
      },
      // Derive protocol/port too: the local Supabase stack serves storage
      // over plain http on a custom port.
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseUrl.hostname,
              ...(supabaseUrl.port ? { port: supabaseUrl.port } : {}),
            },
          ]
        : []),
    ],
  },
  async redirects() {
    return [
      {
        source: "/guide/index.html",
        destination: "/guide",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
