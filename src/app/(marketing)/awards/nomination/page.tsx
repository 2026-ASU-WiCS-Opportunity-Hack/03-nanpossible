import { Metadata } from "next";
import Link from "next/link";
import { NominationForm } from "./NominationForm";

export const metadata: Metadata = {
  title: "Apply or Nominate for a WIAL Award",
  description:
    "Nominate an individual or organization for a WIAL award — or apply yourself. Five categories recognize excellence in Action Learning.",
};

export default function AwardNominationPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Apply or nominate today</h1>
      <p className="text-gray-600 mb-4">
        Nominate an organization or individual whose Action Learning work deserves recognition —
        or put your own work forward. Every submission is acknowledged as soon as it arrives.
      </p>
      <ul className="text-gray-600 text-sm mb-8 list-disc pl-5 space-y-1">
        <li>Past winners may not resubmit a previously awarded project or program.</li>
        <li>Individual awardees must hold a current WIAL coach certification.</li>
        <li>Winners are asked to support WIAL&apos;s publicity around the awards.</li>
        <li>
          Decisions of the WIAL Awards Committee are final. Learn more about the awards on the{" "}
          <Link href="/awards" className="font-semibold text-teal underline">
            WIAL Awards page
          </Link>
          .
        </li>
      </ul>
      <NominationForm />
    </div>
  );
}
