-- WIAL China is no longer an affiliate (confirmed 2026-10-14).
-- The active affiliate roster drops from 16 to 15.
-- The row is kept (inactive) so coach/user history stays intact; inactive
-- chapters are hidden everywhere: no affiliate directory entry, no map
-- chip/ring, and the china.chapterstack.org tenant site no longer resolves.
update public.chapters
set status = 'inactive', updated_at = timezone('utc', now())
where subdomain = 'china'
   or directory_slug = 'wial-china';
