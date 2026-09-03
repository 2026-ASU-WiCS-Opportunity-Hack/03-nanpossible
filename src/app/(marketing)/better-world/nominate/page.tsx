import { Metadata } from "next";
import Link from "next/link";
import { BetterWorldApplicationForm } from "./BetterWorldApplicationForm";

export const metadata: Metadata = {
  title: "Apply for Better World Fund support",
  description:
    "Nominate your community organization for WIAL Better World Fund support — pro bono Action Learning coaching and grant assistance.",
};

export default function BetterWorldNominatePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Apply for Better World Fund support</h1>
      <p className="text-gray-600 mb-4">
        The WIAL Better World Fund provides Action Learning coaching and grant support to
        community-based organizations around the world. Tell us about your organization and the
        need you are facing, and the Better World Fund committee will follow up.
      </p>
      <p className="text-gray-600 text-sm mb-8">
        Learn more about the fund and see past projects on the{" "}
        <Link href="/better-world" className="font-semibold text-teal underline">
          Better World Fund page
        </Link>
        .
      </p>
      <BetterWorldApplicationForm />
    </div>
  );
}
