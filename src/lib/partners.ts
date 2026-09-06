import partnersFixture from "@/content/partners.json";
import {
  PartnersError,
  validatePartnerLogoFile,
  type PartnerInput,
} from "@/lib/partners-fields";
import { slugifyName } from "@/lib/slug";
import { createSupabaseContentClient } from "@/lib/supabase";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import type { Partner } from "@/lib/types";

/**
 * Partner organizations shown on /partners and managed at
 * /admin/global/partners. Rows live in `partners` (public read, service-role
 * write); without a database the app falls back to the crawled fixture in
 * src/content/partners.json (regenerate with `npm run crawl:partners`).
 */

export const PARTNER_LOGO_BUCKET = "partner-logos";

export const partnerColumns =
  "id, slug, name, website_url, description, city, state_province, country, country_code, logo_url, directory_url, sort_order, active";

type PartnerRow = {
  id: string;
  slug: string;
  name: string;
  website_url: string | null;
  description: string | null;
  city: string | null;
  state_province: string | null;
  country: string | null;
  country_code: string | null;
  logo_url: string | null;
  directory_url: string | null;
  sort_order: number | null;
  active: boolean | null;
};

function mapRow(row: PartnerRow): Partner {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    websiteUrl: row.website_url,
    description: row.description,
    city: row.city,
    stateProvince: row.state_province,
    country: row.country,
    countryCode: row.country_code,
    logoUrl: row.logo_url,
    directoryUrl: row.directory_url,
    sortOrder: row.sort_order ?? 0,
    active: row.active ?? true,
  };
}

function toRow(input: PartnerInput) {
  return {
    name: input.name,
    website_url: input.websiteUrl,
    description: input.description,
    city: input.city,
    state_province: input.stateProvince,
    country: input.country,
    logo_url: input.logoUrl,
    sort_order: input.sortOrder,
    active: input.active,
    updated_at: new Date().toISOString(),
  };
}

function byOrder(left: Partner, right: Partner) {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "en");
}

export async function listPartners(
  options: { includeInactive?: boolean } = {},
): Promise<Partner[]> {
  const client = createSupabaseContentClient();

  if (client) {
    try {
      let query = client.from("partners").select(partnerColumns);
      if (!options.includeInactive) {
        query = query.eq("active", true);
      }
      const { data, error } = await query.order("sort_order").order("name");
      if (!error && data) {
        return (data as unknown as PartnerRow[]).map(mapRow);
      }
      console.error("listPartners query failed", error);
    } catch (error) {
      console.error("listPartners threw", error);
    }
  }

  const fixture = (partnersFixture as Partner[]).slice().sort(byOrder);
  return options.includeInactive ? fixture : fixture.filter((partner) => partner.active);
}

function requireServiceClient() {
  const client = createServiceRoleSupabaseClient();
  if (!client) {
    throw new PartnersError("db-unavailable");
  }
  return client;
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  const client = requireServiceClient();
  const { data, error } = await client
    .from("partners")
    .select(partnerColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new PartnersError("save-failed", error.message);
  }
  return data ? mapRow(data as unknown as PartnerRow) : null;
}

async function uniquePartnerSlug(client: ReturnType<typeof requireServiceClient>, name: string) {
  const base = slugifyName(name) || "partner";
  const { data, error } = await client
    .from("partners")
    .select("slug")
    .like("slug", `${base}%`);
  if (error) {
    throw new PartnersError("save-failed", error.message);
  }
  const taken = new Set((data ?? []).map((row) => (row as { slug: string }).slug));
  if (!taken.has(base)) {
    return base;
  }
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

export async function createPartner(input: PartnerInput): Promise<Partner> {
  const client = requireServiceClient();
  const slug = await uniquePartnerSlug(client, input.name);
  const { data, error } = await client
    .from("partners")
    .insert({ slug, ...toRow(input) })
    .select(partnerColumns)
    .single();
  if (error || !data) {
    throw new PartnersError("save-failed", error?.message);
  }
  return mapRow(data as unknown as PartnerRow);
}

export async function updatePartner(id: string, input: PartnerInput): Promise<Partner> {
  const client = requireServiceClient();
  const { data, error } = await client
    .from("partners")
    .update(toRow(input))
    .eq("id", id)
    .select(partnerColumns)
    .maybeSingle();
  if (error) {
    throw new PartnersError("save-failed", error.message);
  }
  if (!data) {
    throw new PartnersError("not-found");
  }
  return mapRow(data as unknown as PartnerRow);
}

export async function setPartnerActive(id: string, active: boolean): Promise<void> {
  const client = requireServiceClient();
  const { error } = await client
    .from("partners")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    throw new PartnersError("save-failed", error.message);
  }
}

export async function deletePartner(id: string): Promise<void> {
  const client = requireServiceClient();
  const { error } = await client.from("partners").delete().eq("id", id);
  if (error) {
    throw new PartnersError("save-failed", error.message);
  }
}

/** Store an admin-uploaded logo in the public bucket and return its URL. */
export async function uploadPartnerLogo(file: File, slug: string): Promise<string> {
  const ext = validatePartnerLogoFile(file);
  const client = requireServiceClient();
  const objectPath = `${slug}-${Date.now().toString(36)}.${ext}`;
  const { error } = await client.storage
    .from(PARTNER_LOGO_BUCKET)
    .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });
  if (error) {
    throw new PartnersError("save-failed", error.message);
  }
  return client.storage.from(PARTNER_LOGO_BUCKET).getPublicUrl(objectPath).data.publicUrl;
}
