'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;
  const subscribedToNewsletter = formData.get('newsletter') === 'on';

  // Validation
  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' };
  }

  if (!email || !email.includes('@')) {
    return { error: 'Valid email is required' };
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
        message: message.trim(),
        subscribed_to_newsletter: subscribedToNewsletter,
      });

    if (error) {
      console.error('Supabase error:', error);
      return { error: 'Failed to send message. Please try again.' };
    }

    revalidatePath('/contact');
    return { success: true };
  } catch (error) {
    console.error('Contact form error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}