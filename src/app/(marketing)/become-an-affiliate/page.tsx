import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/components/content-page";
import { getContentPage } from "@/lib/content";
import { getGlobalSiteContext } from "@/lib/site-context";
import { AffiliateInquiryForm } from "./AffiliateInquiryForm";

export const metadata: Metadata = {
  title: "Become a WIAL Affiliate",
  description:
    "Learn what a WIAL affiliate does and apply to bring WIAL Action Learning to your country or region.",
};

export default async function BecomeAnAffiliatePage() {
  const [siteContext, page] = await Promise.all([
    getGlobalSiteContext(),
    getContentPage({ slug: "become-an-affiliate" }),
  ]);

  if (!page) {
    notFound();
  }

  return (
    <ContentPage page={page} siteContext={siteContext}>
      <section className="site-panel rounded-[2rem] p-6 md:p-8" id="apply">
        <div className="space-y-3">
          <span className="eyebrow">Apply</span>
          <h2 className="section-title text-teal-deep">
            Interested in becoming an affiliate?
          </h2>
          <p className="max-w-3xl text-base leading-7 text-foreground/75">
            Tell us a little about yourself and where you would like to bring
            WIAL Action Learning. Our team will follow up to talk through the
            next steps.
          </p>
        </div>
        <AffiliateInquiryForm />
      </section>
    </ContentPage>
  );
}
