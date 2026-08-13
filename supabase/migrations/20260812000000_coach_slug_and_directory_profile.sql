-- Human-readable coach slugs (canonical slugs come from directory.wial.org)
-- plus the remaining directory profile fields: honorific title, organization,
-- state/province, social links, credentials, honors & awards, hosted CV, and
-- certification expiry.

alter table public.coaches
  add column if not exists slug text,
  add column if not exists title text,
  add column if not exists organization text,
  add column if not exists location_state text,
  add column if not exists blog_url text,
  add column if not exists youtube_url text,
  add column if not exists twitter_url text,
  add column if not exists facebook_url text,
  add column if not exists credentials text,
  add column if not exists awards text,
  add column if not exists cv_url text,
  add column if not exists cert_valid_until date;

-- Backfill slugs from names for rows that don't have one yet (imported coaches
-- are overwritten with their canonical directory slug by the import script).
with candidates as (
  select
    id,
    trim(both '-' from regexp_replace(lower(unaccent(name)), '[^a-z0-9]+', '-', 'g')) as base
  from public.coaches
  where slug is null
),
numbered as (
  select
    id,
    base,
    row_number() over (partition by base order by id) as rn
  from candidates
  where base <> ''
)
update public.coaches c
set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn end
from numbered n
where c.id = n.id
  and not exists (
    select 1
    from public.coaches existing
    where existing.slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn end
  );

create unique index if not exists coaches_slug_key
  on public.coaches (slug)
  where slug is not null;

-- Fold the new identity fields into keyword search.
create or replace function public.coaches_refresh_search_fields()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  spec_text text := coalesce(array_to_string(new.specializations, ' '), '');
  lang_text text := coalesce(array_to_string(new.languages, ' '), '');
  location_text text := concat_ws(' ', new.location_city, new.location_state, new.location_country);
begin
  new.search_text := lower(unaccent(concat_ws(
    ' ',
    new.name,
    new.organization,
    new.cert_level::text,
    location_text,
    spec_text,
    lang_text,
    new.bio,
    new.credentials,
    new.website,
    new.linkedin
  )));

  new.search_vector :=
    setweight(to_tsvector('simple', lower(unaccent(coalesce(new.name, '')))), 'A')
    || setweight(to_tsvector('simple', lower(unaccent(spec_text))), 'B')
    || setweight(
      to_tsvector(
        'simple',
        lower(unaccent(concat_ws(' ', location_text, lang_text, new.cert_level::text, new.organization)))
      ),
      'C'
    )
    || setweight(
      to_tsvector('simple', lower(unaccent(concat_ws(' ', new.bio, new.credentials)))),
      'D'
    );

  return new;
end;
$$;

-- Backfill existing rows through the trigger.
update public.coaches set id = id;

-- Recreate the keyword-search RPC with the new columns (return type changes,
-- so create or replace is not enough).
drop function if exists public.search_coaches_keyword(
  text, text, text, text, text, text, text[], int, int
);

create function public.search_coaches_keyword(
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
    and (filter_language is null or filter_language = any(c.languages))
    and (
      filter_specializations is null
      or cardinality(filter_specializations) = 0
      or c.specializations && filter_specializations
    )
    and (
      c.search_vector @@ q.all_terms_query
      or (q.any_term_query is not null and c.search_vector @@ q.any_term_query)
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
