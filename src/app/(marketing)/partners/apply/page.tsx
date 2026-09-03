import type { Metadata } from "next";
import Link from "next/link";
import { PartnerApplicationForm } from "./PartnerApplicationForm";

export const metadata: Metadata = {
  title: "Apply to become a WIAL partner",
  description:
    "Apply to become a WIAL Action Learning partner — organizations that support the WIAL methodology to solve problems, develop leaders, build teams, and transform organizations.",
};

export default function PartnerApplicationPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Apply to become a partner</h1>
      <p className="text-gray-600 mb-4">
        Tell us about your organization and your interest in WIAL Action Learning. Our team
        reviews every application and will follow up with next steps and pricing for your
        organization&apos;s tier.
      </p>
      <p className="text-gray-600 text-sm mb-8">
        See the full benefits and pricing on the{" "}
        <Link href="/partners" className="font-semibold text-teal underline">
          Our Partners
        </Link>{" "}
        page.
      </p>
      <PartnerApplicationForm />
    </div>
  );
}
