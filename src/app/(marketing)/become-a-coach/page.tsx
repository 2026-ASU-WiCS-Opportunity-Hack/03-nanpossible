import type { Metadata } from "next";
import Link from "next/link";
import { TrackedLink } from "@/components/analytics/tracked-link";
import { certificationBecomeACoach } from "@/content/certification-hub";
import { CoachInterestForm } from "./CoachInterestForm";

// Restores wial.org/become-a-coach/ as its own page with an interest form
// (#161); it used to alias-redirect to /certification.
const title = "Become a Certified Action Learning Coach";
const description =
  "Tell WIAL you want to become a certified Action Learning coach. We connect you with the WIAL affiliate in your country for course dates and next steps.";

export const metadata: Metadata = {
  title: "Become a coach",
  description,
  alternates: { canonical: "/become-a-coach" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/become-a-coach",
    images: [
      {
        url: certificationBecomeACoach.image.src,
        alt: certificationBecomeACoach.image.alt,
      },
    ],
  },
};

const steps = [
  {
    title: "Tell us about you",
    body: "Send the short form below. It takes about a minute.",
  },
  {
    title: "Meet your affiliate",
    body: "WIAL connects you with the affiliate in your country for course dates, format, and fees.",
  },
  {
    title: "Start your certification",
    body: "Begin with the CALC course and grow from there toward PALC and MALC.",
  },
];

export default function BecomeACoachPage() {
  const content = certificationBecomeACoach;

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="space-y-8">
        <div className="grid gap-6 rounded-lg bg-gradient-to-r from-teal-deep/5 to-gold/5 p-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <span className="eyebrow">Become a coach</span>
            <h1 className="mt-3 text-3xl font-bold text-teal-deep">{title}</h1>
            <p className="mt-3 text-base leading-7 text-foreground/75">{content.intro[0]}</p>
            <p className="mt-3 text-base leading-7 text-foreground/75">
              {content.industriesLead.replace(/:$/, "")} — {content.industries.join(", ")},{" "}
              {content.industriesMore}.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a className="button-link primary" href="#interest">
                Start your inquiry
              </a>
              <TrackedLink
                className="button-link"
                event={{
                  name: "cta_click",
                  params: {
                    cta_label: "See the certification pathway",
                    cta_location: "become_a_coach",
                    cta_destination: "/certification",
                  },
                }}
                href="/certification"
              >
                See the certification pathway
              </TrackedLink>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={content.image.alt}
            className="w-full rounded-lg object-cover"
            src={content.image.src}
          />
        </div>

        <section aria-labelledby="coach-steps">
          <h2 className="text-2xl font-bold" id="coach-steps">
            How it works
          </h2>
          <ol className="mt-4 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <li className="site-panel rounded-lg px-6 py-5" key={step.title}>
                <span className="eyebrow">Step {index + 1}</span>
                <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="site-panel rounded-[2rem] p-6 md:p-8" id="interest">
          <div className="space-y-3">
            <span className="eyebrow">Get started</span>
            <h2 className="section-title text-teal-deep">
              Interested in becoming a coach?
            </h2>
            <p className="max-w-3xl text-base leading-7 text-foreground/75">
              Share a few details and we will connect you with the WIAL affiliate in
              your country.
            </p>
          </div>
          <CoachInterestForm />
        </section>

        <p className="text-sm text-foreground/70">
          Want to bring WIAL to your country instead?{" "}
          <Link
            className="font-semibold text-teal-deep underline decoration-gold/60 underline-offset-4"
            href="/become-an-affiliate"
          >
            Become an affiliate
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
