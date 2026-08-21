-- Multilingual coach search: PGroonga for CJK/unspaced-script matching plus a
-- case-insensitive language filter. The `simple` tsvector config tokenizes an
-- unspaced CJK run as a single lexeme and short CJK terms score below the
-- trigram cutoff, so queries like 领导力 or 教练 never matched. PGroonga
-- (Supabase's documented multilingual FTS extension) indexes bigrams and
-- matches inside those runs.

create extension if not exists pgroonga;

create index if not exists coaches_search_text_pgroonga_idx
  on public.coaches
  using pgroonga (search_text);

-- Same signature and return table as 20260812000000 — create or replace only.
create or replace function public.search_coaches_keyword(
  search_query text,
  or_query text default null,
  filter_cert_level text default null,
  filter_country text default null,
  filter_city text default null,
  filter_language text default null,
  filter_specializations text[] default null,
  match_count int default 20,
  match_offset int default 0
)
returns table (
  id uuid,
  user_id uuid,
  chapter_id uuid,
  slug text,
  name text,
  title text,
  organization text,
  email text,
  phone text,
  phone_country_code text,
  photo_url text,
  cert_level public.certification_level,
  cert_valid_until date,
  location_city text,
  location_state text,
  location_country text,
  location_lat double precision,
  location_lng double precision,
  bio text,
  credentials text,
  awards text,
  cv_url text,
  specializations text[],
  languages text[],
  website text,
  linkedin text,
  blog_url text,
  youtube_url text,
  twitter_url text,
  facebook_url text,
  credly_badge_url text,
  credly_badge_image_url text,
  credly_badge_title text,
  credly_badge_synced_at timestamptz,
  approved boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_approved_at timestamptz,
  rejection_reason text,
  rejected_at timestamptz,
  similarity double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with query_input as (
    select
      lower(unaccent(trim(search_query))) as plain_query,
      websearch_to_tsquery('simple', unaccent(trim(search_query))) as all_terms_query,
      case
        when or_query is null or trim(or_query) = '' then null
        else to_tsquery('simple', unaccent(or_query))
      end as any_term_query
  )
  select
    c.id,
    c.user_id,
    c.chapter_id,
    c.slug,
    c.name,
    c.title,
    c.organization,
    c.email,
    c.phone,
    c.phone_country_code,
    c.photo_url,
    c.cert_level,
    c.cert_valid_until,
    c.location_city,
    c.location_state,
    c.location_country,
    c.location_lat,
    c.location_lng,
    c.bio,
    c.credentials,
    c.awards,
    c.cv_url,
    c.specializations,
    c.languages,
    c.website,
    c.linkedin,
    c.blog_url,
    c.youtube_url,
    c.twitter_url,
    c.facebook_url,
    c.credly_badge_url,
    c.credly_badge_image_url,
    c.credly_badge_title,
    c.credly_badge_synced_at,
    c.approved,
    c.created_at,
    c.updated_at,
    c.last_approved_at,
    c.rejection_reason,
    c.rejected_at,
    greatest(
      case when c.search_vector @@ q.all_terms_query then 0.95 else 0 end,
      case
        when q.any_term_query is not null and c.search_vector @@ q.any_term_query
          then 0.8
        else 0
      end,
      case when c.search_text &@ q.plain_query then 0.85 else 0 end,
      case
        when c.search_text &@~ pgroonga_query_escape(q.plain_query) then 0.85
        else 0
      end,
      word_similarity(q.plain_query, c.search_text)
    )::double precision as similarity
  from public.coaches c
  cross join query_input q
  where c.approved = true
    and q.plain_query <> ''
    and c.search_vector is not null
    and (filter_cert_level is null or c.cert_level::text = filter_cert_level)
    and (filter_country is null or c.location_country ilike '%' || filter_country || '%')
    and (filter_city is null or c.location_city ilike '%' || filter_city || '%')
    and (
      filter_language is null
      or exists (
        select 1
        from unnest(c.languages) as lang
        where lower(lang) = lower(filter_language)
      )
    )
    and (
      filter_specializations is null
      or cardinality(filter_specializations) = 0
      or c.specializations && filter_specializations
    )
    and (
      c.search_vector @@ q.all_terms_query
      or (q.any_term_query is not null and c.search_vector @@ q.any_term_query)
      or c.search_text &@ q.plain_query
      or c.search_text &@~ pgroonga_query_escape(q.plain_query)
      or word_similarity(q.plain_query, c.search_text) >= 0.4
      or c.name ilike '%' || trim(search_query) || '%'
    )
  order by
    (c.search_vector @@ q.all_terms_query) desc,
    ts_rank_cd(c.search_vector, coalesce(q.any_term_query, q.all_terms_query), 32) desc,
    word_similarity(q.plain_query, c.search_text) desc,
    c.name asc
  limit greatest(match_count, 0)
  offset greatest(match_offset, 0);
$$;

grant execute on function public.search_coaches_keyword(
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  int,
  int
) to anon, authenticated;
