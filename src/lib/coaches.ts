import { cache } from "react";
import {
  formatCoachLocation,
  getCertificationBadgeTone,
  getCertificationLevelName,
  getCoachInitials,
} from "@/lib/coach-presenters";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-admin";
import { canonicalLanguageName, crossLingualExpansions } from "@/lib/languages";
import { createSupabaseContentClient } from "@/lib/supabase";
import type {
  CertificationLevel,
  CoachFacetOptions,
  CoachMapPoint,
  CoachRecord,
  CoachSearchFilters,
} from "@/lib/types";

const coachColumns = [
  "id",
  "user_id",
  "chapter_id",
  "slug",
  "name",
  "title",
  "organization",
  "email",
  "phone",
  "phone_country_code",
  "photo_url",
  "cert_level",
  "cert_valid_until",
  "location_city",
  "location_state",
  "location_country",
  "location_lat",
  "location_lng",
  "bio",
  "credentials",
  "awards",
  "cv_url",
  "specializations",
  "languages",
  "website",
  "linkedin",
  "blog_url",
  "youtube_url",
  "twitter_url",
  "facebook_url",
  "credly_badge_url",
  "credly_badge_image_url",
  "credly_badge_title",
  "credly_badge_synced_at",
  "approved",
  "created_at",
  "updated_at",
  "last_approved_at",
  "rejection_reason",
  "rejected_at",
].join(", ");

type CoachDbRow = {
  id: string;
  user_id: string | null;
  chapter_id: string | null;
  slug: string | null;
  name: string;
  title: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
  phone_country_code: string | null;
  photo_url: string | null;
  cert_level: CertificationLevel | null;
  cert_valid_until: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  bio: string | null;
  credentials: string | null;
  awards: string | null;
  cv_url: string | null;
  specializations: string[] | null;
  languages: string[] | null;
  website: string | null;
  linkedin: string | null;
  blog_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  credly_badge_url: string | null;
  credly_badge_image_url: string | null;
  credly_badge_title: string | null;
  credly_badge_synced_at: string | null;
  approved: boolean;
  created_at: string;
  updated_at: string;
  last_approved_at: string | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  similarity?: number | null;
};

type CoachListOptions = {
  limit?: number;
  offset?: number;
  filters?: CoachSearchFilters;
  nameQuery?: string | null;
  chapterId?: string | null;
};

type KeywordSearchOptions = {
  query: string;
  filters?: CoachSearchFilters;
  limit?: number;
  offset?: number;
};

type CoachFilterQuery = {
  eq(column: string, value: string | boolean | null): CoachFilterQuery;
  ilike(column: string, pattern: string): CoachFilterQuery;
  contains(column: string, value: string[]): CoachFilterQuery;
  overlaps(column: string, value: string[]): CoachFilterQuery;
};

const COACH_SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "around",
  "coach",
  "coaches",
  "consulting",
  "expert",
  "expertise",
  "for",
  "i",
  "in",
  "is",
  "me",
  "my",
  "near",
  "need",
  "of",
  "on",
  "or",
  "the",
  "who",
  "with",
]);

function toArray(value: string[] | null | undefined) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function extractSearchTerms(query: string) {
  const terms = normalizeSearchText(query)
    .split(/[^\p{L}\p{N}]+/u)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value.length > 1)
    .filter((value) => !COACH_SEARCH_STOP_WORDS.has(value));

  const expanded = new Set(terms);

  for (const term of terms) {
    for (const englishTerm of crossLingualExpansions(term)) {
      for (const word of normalizeSearchText(englishTerm).split(/\s+/)) {
        if (word.length > 1 && !COACH_SEARCH_STOP_WORDS.has(word)) {
          expanded.add(word);
        }
      }
    }
  }

  return [...expanded];
}
function mapCoachRecord(row: CoachDbRow): CoachRecord {
  return {
    id: row.id,
    userId: row.user_id,
    chapterId: row.chapter_id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    phoneCountryCode: row.phone_country_code,
    photoUrl: row.photo_url,
    certLevel: row.cert_level,
    certValidUntil: row.cert_valid_until,
    locationCity: row.location_city,
    locationState: row.location_state,
    locationCountry: row.location_country,
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    bio: row.bio,
    credentials: row.credentials,
    awards: row.awards,
    cvUrl: row.cv_url,
    specializations: toArray(row.specializations),
    languages: toArray(row.languages),
    website: row.website,
    linkedin: row.linkedin,
    blogUrl: row.blog_url,
    youtubeUrl: row.youtube_url,
    twitterUrl: row.twitter_url,
    facebookUrl: row.facebook_url,
    credlyBadgeUrl: row.credly_badge_url,
    credlyBadgeImageUrl: row.credly_badge_image_url,
    credlyBadgeTitle: row.credly_badge_title,
    credlyBadgeSyncedAt: row.credly_badge_synced_at,
    approved: row.approved,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastApprovedAt: row.last_approved_at,
    rejectionReason: row.rejection_reason,
    rejectedAt: row.rejected_at,
    ...(typeof row.similarity === "number"
      ? { similarity: Number(row.similarity) }
      : {}),
  };
}

function applyCoachFilters<T extends CoachFilterQuery>(
  query: T,
  filters: CoachSearchFilters = {},
) {
  if (filters.certLevel) {
    query.eq("cert_level", filters.certLevel);
  }

  if (filters.country) {
    query.ilike("location_country", `%${filters.country}%`);
  }

  if (filters.city) {
    query.ilike("location_city", `%${filters.city}%`);
  }

  if (filters.language) {
    query.contains("languages", [
      canonicalLanguageName(filters.language) ?? filters.language,
    ]);
  }

  if (filters.specializations?.length) {
    query.overlaps("specializations", filters.specializations);
  }

  return query;
}

function buildCoachKeywordHaystack(coach: CoachRecord) {
  return normalizeSearchText(
    [
      coach.name,
      coach.certLevel ?? "",
      coach.locationCity ?? "",
      coach.locationCountry ?? "",
      coach.bio ?? "",
    coach.specializations.join(" "),
      coach.languages.join(" "),
      coach.website ?? "",
      coach.linkedin ?? "",
    ].join(" "),
  );
}

function getKeywordSimilarity(
  coach: CoachRecord,
  normalizedQuery: string,
  searchTerms: string[],
) {
  const haystack = buildCoachKeywordHaystack(coach);
  const name = normalizeSearchText(coach.name);
  const location = [coach.locationCity, coach.locationCountry]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  const matchedTermCount = searchTerms.filter((term) => haystack.includes(term)).length;
  const coverage = searchTerms.length ? matchedTermCount / searchTerms.length : 0;

  if (name === normalizedQuery) {
    return 0.99;
  }

  if (name.includes(normalizedQuery)) {
    return 0.94;
  }

  if (coach.specializations.some((value) => value.toLowerCase().includes(normalizedQuery))) {
    return 0.88;
  }

  if (location.includes(normalizedQuery)) {
    return 0.82;
  }

  if ((coach.bio ?? "").toLowerCase().includes(normalizedQuery)) {
    return 0.76;
  }

  if (coverage > 0) {
    return Math.min(0.9, 0.58 + coverage * 0.28);
  }

  return 0.68;
}

export const listApprovedCoaches = cache(
  async ({
    filters = {},
    limit = 20,
    offset = 0,
    nameQuery = null,
    chapterId = null,
  }: CoachListOptions = {}) => {
    const client = createSupabaseContentClient();

    if (!client) {
      return [] satisfies CoachRecord[];
    }

    try {
      let query = client
        .from("coaches")
        .select(coachColumns)
        .eq("approved", true)
        .order("name", { ascending: true })
        .range(offset, offset + limit - 1);

      if (chapterId) {
        query = query.eq("chapter_id", chapterId);
      }

      query = applyCoachFilters(query, filters);

      if (nameQuery) {
        query.ilike("name", `%${nameQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("listApprovedCoaches query failed", error);
        return [] satisfies CoachRecord[];
      }

      if (!data) {
        return [] satisfies CoachRecord[];
      }

      return (data as unknown as CoachDbRow[]).map((row) => mapCoachRecord(row));
    } catch (error) {
      console.error("listApprovedCoaches threw", error);
      return [] satisfies CoachRecord[];
    }
  },
);

/** Slugs (falling back to ids) of approved coaches, for static params. */
export const listApprovedCoachSlugs = cache(async () => {
  const client = createSupabaseContentClient();

  if (!client) {
    return [] satisfies string[];
  }

  try {
    const { data, error } = await client
      .from("coaches")
      .select("id, slug")
      .eq("approved", true)
      .order("name", { ascending: true })
      .limit(200);

    if (error) {
      console.error("listApprovedCoachSlugs query failed", error);
      return [] satisfies string[];
    }

    return (data ?? []).map((row) => row.slug ?? row.id);
  } catch (error) {
    console.error("listApprovedCoachSlugs threw", error);
    return [] satisfies string[];
  }
});

async function searchCoachesByKeywordRpc({
  query,
  filters = {},
  limit = 20,
  offset = 0,
}: KeywordSearchOptions) {
  const client = createSupabaseContentClient();

  if (!client) {
    return null;
  }

  const searchTerms = extractSearchTerms(query);

  try {
    const { data, error } = await client.rpc("search_coaches_keyword", {
      search_query: query.trim(),
      or_query: searchTerms.length ? searchTerms.join(" | ") : null,
      filter_cert_level: filters.certLevel ?? null,
      filter_country: filters.country ?? null,
      filter_city: filters.city ?? null,
      filter_language: filters.language
        ? canonicalLanguageName(filters.language) ?? filters.language
        : null,
      filter_specializations: filters.specializations ?? null,
      match_count: limit,
      match_offset: offset,
    });

    if (error) {
      console.error("search_coaches_keyword RPC failed", error);
      return null;
    }

    return ((data ?? []) as unknown as CoachDbRow[]).map((row) =>
      mapCoachRecord(row),
    );
  } catch (error) {
    console.error("search_coaches_keyword RPC threw", error);
    return null;
  }
}

export async function searchApprovedCoachesByKeyword({
  query,
  filters = {},
  limit = 20,
  offset = 0,
}: KeywordSearchOptions) {
  const normalizedQuery = normalizeSearchText(query.trim());
  const searchTerms = extractSearchTerms(query);

  if (!normalizedQuery) {
    return [] satisfies CoachRecord[];
  }

  const rpcCoaches = await searchCoachesByKeywordRpc({
    query,
    filters,
    limit,
    offset,
  });

  if (rpcCoaches) {
    return rpcCoaches
      .map((coach) => ({
        ...coach,
        similarity: getKeywordSimilarity(coach, normalizedQuery, searchTerms),
      }))
      .sort((left, right) => (right.similarity ?? 0) - (left.similarity ?? 0));
  }

  const dbBackedCoaches = await listApprovedCoaches({
    filters,
    limit: 200,
    offset: 0,
  });

  return dbBackedCoaches
    .filter((coach) => {
      const haystack = buildCoachKeywordHaystack(coach);

      if (haystack.includes(normalizedQuery)) {
        return true;
      }

      if (!searchTerms.length) {
        return false;
      }

      return searchTerms.some((term) => haystack.includes(term));
    })
    .map((coach) => ({
      ...coach,
      similarity: getKeywordSimilarity(coach, normalizedQuery, searchTerms),
    }))
    .sort((left, right) => (right.similarity ?? 0) - (left.similarity ?? 0))
    .slice(offset, offset + limit);
}

export const getCoachFacetOptions = cache(async (): Promise<CoachFacetOptions> => {
  const client = createSupabaseContentClient();
  const empty: CoachFacetOptions = { countries: [], languages: [] };

  if (!client) {
    return empty;
  }

  try {
    const { data, error } = await client
      .from("coaches")
      .select("location_country, languages")
      .eq("approved", true)
      .order("location_country", { ascending: true })
      .limit(1000);

    if (error) {
      console.error("getCoachFacetOptions query failed", error);
      return empty;
    }

    const countries = new Set<string>();
    const languages = new Set<string>();

    for (const row of data ?? []) {
      const country = toText(row.location_country);

      if (country) {
        countries.add(country);
      }

      for (const language of toArray(row.languages)) {
        languages.add(language);
      }
    }

    return {
      countries: [...countries].sort((left, right) => left.localeCompare(right)),
      languages: [...languages].sort((left, right) => left.localeCompare(right)),
    };
  } catch (error) {
    console.error("getCoachFacetOptions threw", error);
    return empty;
  }
});

export const listCoachMapPoints = cache(async (): Promise<CoachMapPoint[]> => {
  const client = createSupabaseContentClient();

  if (!client) {
    return [];
  }

  try {
    const { data, error } = await client
      .from("coaches")
      .select("location_city, location_country, location_lat, location_lng")
      .eq("approved", true)
      .not("location_lat", "is", null)
      .not("location_lng", "is", null)
      .limit(2000);

    if (error) {
      console.error("listCoachMapPoints query failed", error);
      return [];
    }

    const groups = new Map<string, CoachMapPoint>();

    for (const row of data ?? []) {
      const lat = typeof row.location_lat === "number" ? row.location_lat : null;
      const lng = typeof row.location_lng === "number" ? row.location_lng : null;

      if (lat === null || lng === null || (lat === 0 && lng === 0)) {
        continue;
      }

      const city = toText(row.location_city);
      const country = toText(row.location_country);
      // Coaches without a city share country-level geocodes — group those by
      // rounded coordinates so each distinct place stays one dot.
      const key = `${country ?? ""}|${city ?? `${lat.toFixed(1)},${lng.toFixed(1)}`}`;
      const group = groups.get(key);

      if (group) {
        group.lat = (group.lat * group.count + lat) / (group.count + 1);
        group.lng = (group.lng * group.count + lng) / (group.count + 1);
        group.count += 1;
      } else {
        groups.set(key, { city, country, lat, lng, count: 1 });
      }
    }

    return [...groups.values()].sort((left, right) => right.count - left.count);
  } catch (error) {
    console.error("listCoachMapPoints threw", error);
    return [];
  }
});

export async function getApprovedCoachById(id: string) {
  const client = createSupabaseContentClient();

  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("coaches")
      .select(coachColumns)
      .eq("id", id)
      .eq("approved", true)
      .maybeSingle();

    if (error) {
      console.error("getApprovedCoachById query failed", error);
      return null;
    }

    return data ? mapCoachRecord(data as unknown as CoachDbRow) : null;
  } catch (error) {
    console.error("getApprovedCoachById threw", error);
    return null;
  }
}

export async function getApprovedCoachBySlug(slug: string) {
  const client = createSupabaseContentClient();

  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("coaches")
      .select(coachColumns)
      .eq("slug", decodeURIComponent(slug))
      .eq("approved", true)
      .maybeSingle();

    if (error) {
      console.error("getApprovedCoachBySlug query failed", error);
      return null;
    }

    return data ? mapCoachRecord(data as unknown as CoachDbRow) : null;
  } catch (error) {
    console.error("getApprovedCoachBySlug threw", error);
    return null;
  }
}

export async function getCoachByIdForAdmin(id: string) {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return null;
  }

  const { data } = await client
    .from("coaches")
    .select(coachColumns)
    .eq("id", id)
    .maybeSingle();

  return data ? mapCoachRecord(data as unknown as CoachDbRow) : null;
}

export async function getCoachByUserId(userId: string) {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return null;
  }

  const { data } = await client
    .from("coaches")
    .select(coachColumns)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapCoachRecord(data as unknown as CoachDbRow) : null;
}

export async function getClaimableCoachByEmail(email: string) {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return null;
  }

  const { data } = await client
    .from("coaches")
    .select(coachColumns)
    .is("user_id", null)
    .ilike("email", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapCoachRecord(data as unknown as CoachDbRow) : null;
}

export async function listPendingCoaches(options: {
  chapterId?: string | null;
  limit?: number;
}) {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return [];
  }

  let query = client
    .from("coaches")
    .select(coachColumns)
    .eq("approved", false)
    .order("updated_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.chapterId) {
    query = query.eq("chapter_id", options.chapterId);
  }

  const { data } = await query;

  return ((data ?? []) as unknown as CoachDbRow[]).map((row) =>
    mapCoachRecord(row),
  );
}

/** Paged coach roster for the global admin, optionally filtered by name. */
export async function listCoachesForAdmin(options: {
  query?: string | null;
  limit?: number;
  offset?: number;
}) {
  const client = createServiceRoleSupabaseClient();

  if (!client) {
    return { coaches: [] as CoachRecord[], total: 0 };
  }

  try {
    let query = client
      .from("coaches")
      .select(coachColumns, { count: "exact" })
      .order("name", { ascending: true })
      .range(
        options.offset ?? 0,
        (options.offset ?? 0) + (options.limit ?? 25) - 1,
      );

    if (options.query?.trim()) {
      query = query.ilike("name", `%${options.query.trim()}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("listCoachesForAdmin query failed", error);
      return { coaches: [] as CoachRecord[], total: 0 };
    }

    return {
      coaches: ((data ?? []) as unknown as CoachDbRow[]).map((row) =>
        mapCoachRecord(row),
      ),
      total: count ?? 0,
    };
  } catch (error) {
    console.error("listCoachesForAdmin threw", error);
    return { coaches: [] as CoachRecord[], total: 0 };
  }
}

export {
  formatCoachLocation,
  getCertificationBadgeTone,
  getCertificationLevelName,
  getCoachInitials,
};
