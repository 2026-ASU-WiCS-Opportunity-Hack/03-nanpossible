import { Metadata } from "next";
import Link from "next/link";
import { SuccessStoryForm } from "./SuccessStoryForm";

export const metadata: Metadata = {
  title: "Share your success story",
  description:
    "Tell us how Action Learning has impacted you — an experience with a coach, a result you have noticed, or anything involving Action Learning.",
};

export default function SuccessStoryPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Share your success story</h1>
      <p className="text-gray-600 mb-4">
        Tell us how Action Learning has impacted you. From an experience with a coach, to a result
        you have noticed, to anything involving Action Learning. We want to hear what you have to
        say.
      </p>
      <p className="text-gray-600 text-sm mb-8">
        Stories may appear on the{" "}
        <Link href="/clients" className="font-semibold text-teal underline">
          Our Clients
        </Link>{" "}
        page. You can also{" "}
        <Link href="/contact" className="font-semibold text-teal underline">
          contact WIAL
        </Link>{" "}
        if you would rather send a message.
      </p>
      <SuccessStoryForm />
    </div>
  );
}
