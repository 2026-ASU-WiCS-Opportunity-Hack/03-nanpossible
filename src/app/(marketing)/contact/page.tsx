import { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact WIAL",
  description: "Contact WIAL for questions about Action Learning, certification programs, events, and more.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-4">Contact WIAL</h1>
      <p className="text-gray-600 mb-8">
        Have questions about WIAL, Action Learning, or our certification programs? 
        Fill out the form below and we will get back to you promptly.
      </p>
      <p className="text-gray-600 mb-8">
        Thinking about bringing WIAL to your country?{" "}
        <Link className="font-semibold text-teal" href="/become-an-affiliate">
          Learn how to become a WIAL affiliate
        </Link>
        .
      </p>
      <ContactForm />
    </div>
  );
}