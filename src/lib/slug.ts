import type { SupabaseClient } from "@supabase/supabase-js";

/** "Đàm Thị Minh Hạnh" → "dam-thi-minh-hanh". */
export function slugifyName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slug for a new coach row, suffixed -2, -3, … when the name collides with an
 * existing coach. Slugs are stable: they are generated once at creation and
 * never regenerated on rename.
 */
export async function ensureUniqueCoachSlug(
  client: SupabaseClient,
  name: string,
): Promise<string | null> {
  const base = slugifyName(name);

  if (!base) {
    return null;
  }

  const { data, error } = await client
    .from("coaches")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) {
    console.error("ensureUniqueCoachSlug lookup failed", error);
    return null;
  }

  const taken = new Set((data ?? []).map((row) => row.slug));

  if (!taken.has(base)) {
    return base;
  }

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  return null;
}
