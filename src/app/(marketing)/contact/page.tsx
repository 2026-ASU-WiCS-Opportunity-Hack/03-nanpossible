import { Metadata } from "next";
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
      <ContactForm />
    </div>
  );
}