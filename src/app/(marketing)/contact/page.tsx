import { Metadata } from "next";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { resolveContactAbout } from "@/lib/contact-about";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact WIAL",
  description: "Contact WIAL for questions about Action Learning, certification programs, events, and more.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ about?: string | string[] }>;
}) {
  const { about } = await searchParams;
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Contact WIAL</h1>
      <p className="text-gray-600 mb-8">
        Have questions about WIAL, Action Learning, or our certification programs? 
        Fill out the form below and we will get back to you promptly.
      </p>
      <aside className="site-panel mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
        <div className="max-w-xl">
          <h2 className="text-lg font-semibold text-teal-deep">
            Bring WIAL to your country
          </h2>
          <p className="mt-1 text-sm text-foreground/70">
            Affiliates deliver WIAL certification locally and build the regional
            community of coaches. See the benefits, who can apply, and how it works.
          </p>
        </div>
        <TrackedLink
          className="button-link primary"
          event={{
            name: "cta_click",
            params: {
              cta_label: "Become an affiliate",
              cta_location: "contact_page",
              cta_destination: "/become-an-affiliate",
            },
          }}
          href="/become-an-affiliate"
        >
          Become an affiliate
        </TrackedLink>
      </aside>
      <ContactForm defaultAbout={resolveContactAbout(about)} />
    </div>
  );
}