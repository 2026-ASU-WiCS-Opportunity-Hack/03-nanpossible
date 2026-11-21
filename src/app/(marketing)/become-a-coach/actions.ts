"use server";

import { affiliateSiteUrl } from "@/lib/affiliates";
import {
  buildCoachInterestEmail,
  coachLeadRecipients,
  parseCoachInterest,
  type CoachInterestAffiliate,
} from "@/lib/coach-interest";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { normalizeNewsletterEmail } from "@/lib/newsletter-fields";
import { sendResendEmail } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { listAffiliateDirectory } from "@/lib/tenant";

export type CoachInterestResult = {
  success?: boolean;
  error?: string;
  country?: string;
  affiliate?: CoachInterestAffiliate | null;
  /** True when the newsletter box was ticked and the signup went through. */
  subscribed?: boolean;
};

async function findAffiliateForCountry(country: string): Promise<CoachInterestAffiliate | null> {
  try {
    const key = country.toLowerCase();
    const match = (await listAffiliateDirectory()).find(
      (affiliate) => affiliate.country?.trim().toLowerCase() === key,
    );
    if (!match) return null;
    return {
      name: match.name,
      url: affiliateSiteUrl(match, process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "wial.org"),
    };
  } catch {
    return null;
  }
}

export async function submitCoachInterest(formData: FormData): Promise<CoachInterestResult> {
  // Honeypot: real visitors never fill the hidden field.
  if (String(formData.get("website") ?? "").trim()) {
    return { success: true };
  }

  const parsed = parseCoachInterest(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const { lead } = parsed;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("coach_interest_leads").insert({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      message: lead.message,
      subscribed_to_newsletter: lead.subscribedToNewsletter,
    });

    if (error) {
      console.error("Coach interest error:", error);
      return { error: "We could not send your inquiry. Please try again." };
    }
  } catch (error) {
    console.error("Coach interest error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  const affiliate = await findAffiliateForCountry(lead.country);

  // The lead is already stored, so a notification problem never fails the form.
  try {
    const to = coachLeadRecipients(process.env.COACH_LEAD_NOTIFY_EMAILS);
    if (to.length === 0) {
      console.warn("Coach interest: COACH_LEAD_NOTIFY_EMAILS is not set; notification skipped.");
    } else {
      const result = await sendResendEmail({ to, ...buildCoachInterestEmail(lead, affiliate) });
      if (!result.delivered) {
        console.error("Coach interest notification failed:", result.error);
      }
    }
  } catch (error) {
    console.error("Coach interest notification failed:", error);
  }

  // The opt-in box signs them up straight away; a failure never fails the form.
  let subscribed = false;
  const newsletterEmail = lead.subscribedToNewsletter ? normalizeNewsletterEmail(lead.email) : null;
  if (newsletterEmail) {
    subscribed = (await subscribeToNewsletter(newsletterEmail, "become_a_coach")).ok;
  }

  return { success: true, country: lead.country, affiliate, subscribed };
}
