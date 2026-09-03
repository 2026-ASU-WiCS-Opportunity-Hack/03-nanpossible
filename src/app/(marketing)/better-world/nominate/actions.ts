'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
      return { error: 'Organization website must start with http:// or https://' as const };
    }
    return { value: url.toString() };
  } catch {
    return { error: 'Please enter a valid organization website URL' as const };
  }
}

export async function submitBetterWorldApplication(formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const organizationName = formData.get('organizationName');
  const mission = formData.get('mission');
  const urgentNeed = formData.get('urgentNeed');
  const howItWouldHelp = formData.get('howItWouldHelp');
  const consent = formData.get('consent') === 'on';
  const organizationWebsite = optionalUrl(formData.get('organizationWebsite'));

  if (typeof name !== 'string' || name.trim().length === 0) {
    return { error: 'Your name is required' };
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return { error: 'A valid email is required' };
  }

  if (typeof organizationName !== 'string' || organizationName.trim().length === 0) {
    return { error: 'Organization name is required' };
  }

  if (typeof mission !== 'string' || mission.trim().length === 0) {
    return { error: "Please describe your organization's mission and who it serves" };
  }

  if (typeof urgentNeed !== 'string' || urgentNeed.trim().length === 0) {
    return { error: 'Please describe the problem or need you are facing' };
  }

  if (typeof howItWouldHelp !== 'string' || howItWouldHelp.trim().length === 0) {
    return { error: 'Please tell us how Action Learning coaching would help' };
  }

  if (organizationWebsite && 'error' in organizationWebsite) {
    return { error: organizationWebsite.error };
  }

  if (!consent) {
    return { error: 'Please confirm you consent to WIAL contacting you about this application' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from('better_world_applications').insert({
      name: name.trim(),
      email: email.trim(),
      role: optionalText(formData.get('role')),
      organization_name: organizationName.trim(),
      organization_website: organizationWebsite?.value ?? null,
      country: optionalText(formData.get('country')),
      organization_type: optionalText(formData.get('organizationType')),
      registered_nonprofit: optionalText(formData.get('registeredNonprofit')),
      years_in_operation: optionalText(formData.get('yearsInOperation')),
      affiliate_type: optionalText(formData.get('affiliateType')),
      mission: mission.trim(),
      urgent_need: urgentNeed.trim(),
      support_requested: optionalText(formData.get('supportRequested')),
      how_it_would_help: howItWouldHelp.trim(),
      other_funding: optionalText(formData.get('otherFunding')),
      funding_needed: optionalText(formData.get('fundingNeeded')),
      additional_info: optionalText(formData.get('additionalInfo')),
      consent,
    });

    if (error) {
      console.error('Supabase error:', error);
      return { error: 'Failed to send your application. Please try again.' };
    }

    revalidatePath('/better-world/nominate');
    return { success: true };
  } catch (error) {
    console.error('Better World application form error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
