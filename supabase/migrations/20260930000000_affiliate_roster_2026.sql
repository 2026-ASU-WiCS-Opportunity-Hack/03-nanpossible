-- 2026 affiliate roster review: 16 active affiliates.
-- France is no longer an affiliate; Russia and Indonesia were dropped this
-- year (dues unpaid, no response from leadership). Rows are kept (inactive)
-- so coach/user history stays intact; inactive chapters are hidden everywhere.
update public.chapters
set status = 'inactive', updated_at = timezone('utc', now())
where subdomain in ('france', 'russia', 'indonesia')
   or directory_slug in ('wial-france', 'wial-russia', 'wial-indonesia');

-- Official websites confirmed by WIAL.
update public.chapters
set website_url = 'https://www.jial.or.jp/en/', updated_at = timezone('utc', now())
where subdomain = 'japan' or directory_slug = 'wial-japan';

update public.chapters
set website_url = 'https://wialnigeria.org/', updated_at = timezone('utc', now())
where subdomain = 'nigeria' or directory_slug = 'wial-nigeria';

-- Broken directory websites: wial.sg shows a hosting "account suspended" page
-- and wialthailand.com redirects to wial.org. Clearing them makes these
-- affiliates link to their hosted <subdomain>.chapterstack.org site instead.
update public.chapters
set website_url = null, updated_at = timezone('utc', now())
where subdomain in ('singapore', 'thailand')
   or directory_slug in ('wial-singapore', 'wial-thailand');

-- WIAL Netherlands moved from wialnl.nl to wial.nl.
update public.chapters
set website_url = 'https://wial.nl/', updated_at = timezone('utc', now())
where subdomain = 'netherlands' or directory_slug = 'wial-netherlands';
