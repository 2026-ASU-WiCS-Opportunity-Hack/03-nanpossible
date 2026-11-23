import type { Metadata } from "next";
import { DonationFundPage, type DonatePageProps } from "@/components/donations/donation-fund-page";
import { getDonationFund } from "@/lib/payments-format";

export const metadata: Metadata = {
  title: "Donate to the Better World Fund",
  description:
    "Support the WIAL Better World Fund — every contribution goes directly to bringing Action Learning to community organizations.",
};

export const dynamic = "force-dynamic";

export default function BetterWorldDonatePage({ searchParams }: DonatePageProps) {
  return <DonationFundPage fund={getDonationFund("better-world")} searchParams={searchParams} />;
}
