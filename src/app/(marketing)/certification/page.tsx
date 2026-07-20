import { Metadata } from "next";
import { CertificationHubSections } from "@/components/certification-hub";
import {
  certificationHero,
  certificationTracks,
} from "@/content/certification-hub";

export const metadata: Metadata = {
  title: "Certification | WIAL",
  description:
    "WIAL certification programs - CALC, PALC, SALC, and MALC certification for Action Learning coaches.",
};

export default async function CertificationHubPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <CertificationHubSections />
    </main>
  );
}