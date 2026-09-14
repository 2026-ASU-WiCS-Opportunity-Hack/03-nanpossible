import type { Metadata } from "next";
import { InHouseProgramsPage } from "@/components/certification-in-house";
import { certificationInHouse } from "@/content/certification-hub";

// Restores wial.org/certification/in-house-programs/ as its own page (#143);
// the hub at /certification links here from its in-house teaser.
export const metadata: Metadata = {
  title: "In-house certification programs",
  description: certificationInHouse.metaDescription,
  alternates: { canonical: certificationInHouse.href },
  openGraph: {
    title: certificationInHouse.pageTitle,
    description: certificationInHouse.metaDescription,
    type: "website",
    url: certificationInHouse.href,
    images: [{ url: certificationInHouse.image.src, alt: certificationInHouse.image.alt }],
  },
};

export default function CertificationInHouseProgramsPage() {
  return <InHouseProgramsPage />;
}
