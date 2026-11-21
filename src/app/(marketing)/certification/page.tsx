import { Metadata } from "next";
import { CertificationFindTraining } from "@/components/certification-find-training";
import { CertificationHubSections } from "@/components/certification-hub";
import { renderSection } from "@/components/content-page";
import { getClientTestimonials, getContentPage } from "@/lib/content";

export const metadata: Metadata = {
  title: "How to become a Certified Action Learning Coach",
  description:
    "The WIAL certification journey step by step — Foundations, CALC, PALC, and MALC — with prerequisites, time commitment, renewal, what you get, and where to find training in your country.",
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
        findTraining={<CertificationFindTraining />}
        beforeContact={highlights?.map((section) => renderSection(section, { testimonials }))}
      />
    </main>
  );
}
