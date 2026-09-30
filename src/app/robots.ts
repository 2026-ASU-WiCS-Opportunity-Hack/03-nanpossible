import type { MetadataRoute } from "next";
import { isSearchIndexingAllowed } from "@/lib/seo";

// Served at /robots.txt (the middleware passes that path through untouched).
// The whole site stays out of search results until the wial.org cutover —
// see src/lib/seo.ts for the flag that opens it up.
export default function robots(): MetadataRoute.Robots {
  if (isSearchIndexingAllowed()) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/account/", "/api/"] }],
    };
  }

  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
