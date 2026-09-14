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
  async headers() {
    // Mirrors src/lib/seo.ts (next.config cannot use the @/ alias): keep the
    // staging deployment out of search engines, including static files that
    // never render the <meta name="robots"> tag.
    const allowIndexing = ["true", "1", "yes"].includes(
      (process.env.NEXT_PUBLIC_ALLOW_SEARCH_INDEXING ?? "").trim().toLowerCase(),
    );
    if (allowIndexing) {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
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
