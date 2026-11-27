-- Global events calendar (#184).
--
-- An event with no affiliate (chapter_id IS NULL) is a WIAL-wide event that
-- only platform admins can manage; affiliate events keep their chapter_id.
-- `link_url` is an optional "more details / register" link shown with the event.

alter table public.events alter column chapter_id drop not null;
alter table public.events add column if not exists link_url text;

-- Published events are public information, so the consolidated calendar on
-- the main site can read them from any affiliate (not just the tenant named
-- in the request headers, as before). Drafts and events of draft/inactive
-- affiliates stay hidden. The existing manage policies already keep global
-- events (NULL chapter_id) writable by platform admins only: `chapter_id = …`
-- is never true for NULL.
drop policy if exists "public can read events" on public.events;

create policy "public can read events"
on public.events
for select
to anon, authenticated
using (
  published = true
  and (
    chapter_id is null
    or exists (
      select 1
      from public.chapters c
      where c.id = events.chapter_id
        and c.status = 'active'
    )
  )
);

create index if not exists events_published_start_idx on public.events (start_at) where published;
