import type { Metadata } from "next";
import { DonationFundPage, type DonatePageProps } from "@/components/donations/donation-fund-page";
import { getDonationFund } from "@/lib/payments-format";

export const metadata: Metadata = {
  title: "Donate to the Marquardt Legacy Fund",
  description:
    "Give to the WIAL Marquardt Legacy Fund, honoring WIAL co-founder Michael Marquardt and the WIAL model of Action Learning.",
};

export const dynamic = "force-dynamic";

export default function MarquardtLegacyFundPage({ searchParams }: DonatePageProps) {
  return (
    <DonationFundPage fund={getDonationFund("marquardt-legacy")} searchParams={searchParams} />
  );
}
