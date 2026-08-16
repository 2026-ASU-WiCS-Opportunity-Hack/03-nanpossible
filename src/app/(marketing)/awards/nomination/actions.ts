'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { AWARD_CATEGORY_VALUES } from './categories';

export async function submitAwardNomination(formData: FormData) {
  const nominationType = formData.get('nominationType') as string;
  const awardCategory = formData.get('awardCategory') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const location = formData.get('location') as string;
  const designation = formData.get('designation') as string;
  const company = formData.get('company') as string;
  const companyWebsite = formData.get('companyWebsite') as string;
  const nomineeName = formData.get('nomineeName') as string;
  const nomineeEmail = formData.get('nomineeEmail') as string;
  const nomineeLocation = formData.get('nomineeLocation') as string;
  const nomineeDesignation = formData.get('nomineeDesignation') as string;
  const nomineeCompany = formData.get('nomineeCompany') as string;
  const nomineeWebsite = formData.get('nomineeWebsite') as string;
  const reason = formData.get('reason') as string;
  const supportingMaterialsUrl = formData.get('supportingMaterialsUrl') as string;
  const nomineeConsent = formData.get('nomineeConsent') === 'on';

  const isThirdParty = nominationType === 'third_party';

  if (nominationType !== 'third_party' && nominationType !== 'self') {
    return { error: 'Please choose whether you are nominating someone else or applying yourself' };
  }

  if (!awardCategory || !AWARD_CATEGORY_VALUES.includes(awardCategory)) {
    return { error: 'Please select an award category' };
  }

  if (!name || name.trim().length === 0) {
    return { error: 'Name is required' };
  }

  if (!email || !email.includes('@')) {
    return { error: 'Valid email is required' };
  }

  if (isThirdParty && (!nomineeName || nomineeName.trim().length === 0)) {
    return { error: "Nominee's name is required" };
  }

  if (isThirdParty && !nomineeConsent) {
    return { error: 'Please confirm the nominee consents to this nomination' };
  }

  if (!reason || reason.trim().length === 0) {
    return { error: 'Please tell us the reason for the nomination or application' };
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from('award_nominations').insert({
      nomination_type: nominationType,
      award_category: awardCategory,
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      location: location?.trim() || null,
      designation: designation?.trim() || null,
      company: company?.trim() || null,
      company_website: companyWebsite?.trim() || null,
      nominee_name: isThirdParty ? nomineeName?.trim() || null : null,
      nominee_email: isThirdParty ? nomineeEmail?.trim() || null : null,
      nominee_location: isThirdParty ? nomineeLocation?.trim() || null : null,
      nominee_designation: isThirdParty ? nomineeDesignation?.trim() || null : null,
      nominee_company: isThirdParty ? nomineeCompany?.trim() || null : null,
      nominee_website: isThirdParty ? nomineeWebsite?.trim() || null : null,
      reason: reason.trim(),
      supporting_materials_url: supportingMaterialsUrl?.trim() || null,
      nominee_consent: isThirdParty ? nomineeConsent : false,
    });

    if (error) {
      console.error('Supabase error:', error);
      return { error: 'Failed to send your nomination. Please try again.' };
    }

    revalidatePath('/awards/nomination');
    return { success: true };
  } catch (error) {
    console.error('Award nomination form error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
