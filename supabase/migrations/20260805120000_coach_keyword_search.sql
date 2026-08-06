-- Postgres-native coach search: weighted full-text search + trigram fuzzy matching.
-- Replaces the Cohere/pgvector semantic pipeline with a zero-dependency lexical
-- engine. The legacy vector artifacts (embedding column, search_coaches,
-- set_coach_embedding) are left in place so this migration is non-destructive.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

alter table public.coaches
  add column if not exists search_text text,
  add column if not exists search_vector tsvector;

-- Trigger (rather than generated columns) so we can use unaccent and
-- array_to_string, which are stable — not immutable — functions.
create or replace function public.coaches_refresh_search_fields()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  spec_text text := coalesce(array_to_string(new.specializations, ' '), '');
  lang_text text := coalesce(array_to_string(new.languages, ' '), '');
  location_text text := concat_ws(' ', new.location_city, new.location_country);
begin
  new.search_text := lower(unaccent(concat_ws(
    ' ',
    new.name,
    new.cert_level::text,
    location_text,
    spec_text,
    lang_text,
    new.bio,
    new.website,
    new.linkedin
  )));

  new.search_vector :=
    setweight(to_tsvector('simple', lower(unaccent(coalesce(new.name, '')))), 'A')
    || setweight(to_tsvector('simple', lower(unaccent(spec_text))), 'B')
    || setweight(
      to_tsvector(
        'simple',
        lower(unaccent(concat_ws(' ', location_text, lang_text, new.cert_level::text)))
      ),
      'C'
    )
    || setweight(to_tsvector('simple', lower(unaccent(coalesce(new.bio, '')))), 'D');

  return new;
end;
$$;

drop trigger if exists coaches_search_fields_trigger on public.coaches;

create trigger coaches_search_fields_trigger
before insert or update on public.coaches
for each row
execute function public.coaches_refresh_search_fields();

-- Backfill existing rows through the trigger.
update public.coaches set id = id;

create index if not exists coaches_search_vector_idx
  on public.coaches
  using gin (search_vector);

create index if not exists coaches_search_text_trgm_idx
  on public.coaches
  using gin (search_text gin_trgm_ops);

-- Lexical search over approved coaches. `search_query` is the raw user query;
-- `or_query` is an optional pre-sanitized tsquery string of significant terms
-- joined with ' | ' (built app-side) so multi-word queries can match on ANY
-- term instead of requiring ALL terms.
--
-- security definer: the coaches RLS policy calls current_app_role(), which
-- reads public.users — a table anon cannot select from. This function only
-- ever returns approved rows (the same data the public policy exposes), so
-- bypassing RLS here is safe and keeps the RPC callable by anon.
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
  name text,
  email text,
  phone text,
  phone_country_code text,
  photo_url text,
  cert_level public.certification_level,
  location_city text,
  location_country text,
  location_lat double precision,
  location_lng double precision,
  bio text,
  specializations text[],
  languages text[],
  website text,
  linkedin text,
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
    c.name,
    c.email,
    c.phone,
    c.phone_country_code,
    c.photo_url,
    c.cert_level,
    c.location_city,
    c.location_country,
    c.location_lat,
    c.location_lng,
    c.bio,
    c.specializations,
    c.languages,
    c.website,
    c.linkedin,
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
