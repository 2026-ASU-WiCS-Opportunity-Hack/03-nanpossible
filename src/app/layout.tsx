import type { Metadata } from "next";
import { headers } from "next/headers";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import { SiteChromeFrame } from "@/components/site-chrome-frame";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-ubuntu",
  display: "swap",
});
import { getAccessibilityBootScript } from "@/lib/accessibility-preferences";
import { getCurrentViewer } from "@/lib/auth";
import { getLayoutSiteContext } from "@/lib/site-context";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "WIAL | World Institute for Action Learning",
    template: "%s | WIAL",
  },
  description:
    "The World Institute for Action Learning (WIAL) certifies Action Learning coaches and supports a global network of affiliates helping organizations solve real problems while developing leaders and teams.",
  icons: {
    icon: [
      { url: "/assets/logo.webp", sizes: "16x16", type: "image/webp" },
      { url: "/assets/logo.webp", sizes: "32x32", type: "image/webp" },
      { url: "/assets/logo.webp", sizes: "48x48", type: "image/webp" },
    ],
    apple: [
      { url: "/assets/logo.webp", sizes: "180x180", type: "image/webp" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const [siteContext, viewer] = await Promise.all([
    getLayoutSiteContext(headerStore),
    getCurrentViewer(),
  ]);

  return (
    <html
      lang="en"
      className={`${ubuntu.variable} h-full bg-background antialiased text-scale-default contrast-default line-height-default`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: getAccessibilityBootScript(),
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <SiteChromeFrame siteContext={siteContext} viewer={viewer}>
          {children}
        </SiteChromeFrame>
      </body>
    </html>
  );
}
