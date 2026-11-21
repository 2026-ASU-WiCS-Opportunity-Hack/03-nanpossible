'use server';

import { coachLeadRecipients } from '@/lib/coach-interest';
import { buildContactNotificationEmail } from '@/lib/contact-notification';
import { sendResendEmail } from '@/lib/resend';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const country = formData.get('country') as string;
  const about = formData.get('about') as string;
  const message = formData.get('message') as string;
  const subscribedToNewsletter = formData.get('newsletter') === 'on';

  // Validation
  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' };
  }

  if (!email || !email.includes('@')) {
    return { error: 'Valid email is required' };
  }

  if (!country || country.trim().length === 0) {
    return { error: 'Country is required' };
  }

  if (!about || about.trim().length === 0) {
    return { error: 'Please select what this is about' };
  }

  if (!message || message.trim().length === 0) {
    return { error: 'Message is required' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim(),
        country: country.trim(),
        about: about.trim(),
        message: message.trim(),
        subscribed_to_newsletter: subscribedToNewsletter,
      });

    if (error) {
      console.error('Supabase error:', error);
      return { error: 'Failed to send message. Please try again.' };
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  // The message is already stored, so a notification problem never fails the form.
  try {
    const to = coachLeadRecipients(process.env.COACH_LEAD_NOTIFY_EMAILS);
    if (to.length === 0) {
      console.warn('Contact form: COACH_LEAD_NOTIFY_EMAILS is not set; notification skipped.');
    } else {
      const result = await sendResendEmail({
        to,
        ...buildContactNotificationEmail({
          name: name.trim(),
          email: email.trim(),
          country: country.trim(),
          about: about.trim(),
          message: message.trim(),
          subscribedToNewsletter,
        }),
      });
      if (!result.delivered) {
        console.error('Contact form notification failed:', result.error);
      }
    }
  } catch (error) {
    console.error('Contact form notification failed:', error);
  }

  revalidatePath('/contact');
  return { success: true };
}