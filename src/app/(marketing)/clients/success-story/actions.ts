'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const INDUSTRIES = [
  'Manufacturing',
  'Banking',
  'Retail',
  'Hospitality',
  'Technology',
  'Education',
  'Government',
  'Other',
] as const;

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalUrl(value: FormDataEntryValue | null) {
  const trimmed = optionalText(value);
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { error: 'Company logo link must start with http:// or https://' as const };
    }
    return { value: url.toString() };
  } catch {
    return { error: 'Please enter a valid company logo URL' as const };
  }
}

export async function submitSuccessStory(formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const successStory = formData.get('successStory');
  const industry = optionalText(formData.get('industry'));
  const companyLogo = optionalUrl(formData.get('companyLogoUrl'));

  if (typeof name !== 'string' || name.trim().length === 0) {
    return { error: 'Name is required' };
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return { error: 'Valid email is required' };
  }

  if (typeof successStory !== 'string' || successStory.trim().length === 0) {
    return { error: 'Please tell us your success story' };
  }

  if (industry && !INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number])) {
    return { error: 'Please choose an industry from the list' };
  }

  if (companyLogo && 'error' in companyLogo) {
    return { error: companyLogo.error };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from('success_stories').insert({
      name: name.trim(),
      email: email.trim(),
      country: optionalText(formData.get('country')),
      company: optionalText(formData.get('company')),
      title_at_company: optionalText(formData.get('titleAtCompany')),
      industry,
      program_type: optionalText(formData.get('programType')),
      coach_name: optionalText(formData.get('coachName')),
      success_story: successStory.trim(),
      key_results: optionalText(formData.get('keyResults')),
      quote: optionalText(formData.get('quote')),
      company_logo_url: companyLogo?.value ?? null,
      comment: optionalText(formData.get('comment')),
    });

    if (error) {
      console.error('Supabase error:', error);
      return { error: 'Failed to send your story. Please try again.' };
    }

    revalidatePath('/clients/success-story');
    return { success: true };
  } catch (error) {
    console.error('Success story form error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
