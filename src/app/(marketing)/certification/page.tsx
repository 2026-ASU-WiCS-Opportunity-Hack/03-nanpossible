import { Metadata } from "next";
import { CertificationHubSections } from "@/components/certification-hub";
import { renderSection } from "@/components/content-page";
import { getClientTestimonials, getContentPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "Certification",
  description:
    "WIAL certification programs — CALC, PALC, and MALC — plus Foundations of Action Learning, the CALC certification course, in-house programs, and how to become a coach.",
};

export default async function CertificationHubPage() {
  // The hub is a static component, so the testimonial highlights (rules live in
  // the `certification` content page) are rendered here and slotted in.
  const [page, testimonials] = await Promise.all([
    getContentPage({ slug: "certification" }),
    getClientTestimonials(),
  ]);
  const highlights = page?.bodyRichtext.sections.filter(
    (section) => section.type === "testimonial_highlights",
  );

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <CertificationHubSections
        beforeContact={highlights?.map((section) => renderSection(section, { testimonials }))}
      />
    </main>
  );
}
