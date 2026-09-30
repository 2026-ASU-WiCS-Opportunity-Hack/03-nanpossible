-- ============================================================
-- Migration: WIAL affiliate roster (17 affiliates)
-- Date: 2026-09-13
-- Description:
--   Bring the `chapters` table in line with WIAL's confirmed affiliate
--   roster: Brazil, Cambodia, Canada, China, France, Italy, Japan,
--   Malaysia, Netherlands, Nigeria, Philippines, Poland, Singapore,
--   Taiwan, Thailand, USA, Vietnam (confirmed by WIAL, 2026-09-13).
--
--   Profile details come from data/affiliates-directory.json (crawled from
--   directory.wial.org on 2026-09-05). The directory went offline in
--   September 2026; the Wayback capture of its listing on 2026-02-28 —
--   https://web.archive.org/web/20260228034924/http://directory.wial.org/affiliates
--   — lists the same 18 profiles, and profile pages were never archived.
--
--   Idempotent: each affiliate updates the chapter matched by
--   directory_slug, else by subdomain, else by name, and is inserted only
--   when nothing matches. Directory-owned columns follow the directory;
--   admin-curated ones (country, region, description) are filled only when
--   empty; website_url is taken from the directory when it had one —
--   except WIAL Vietnam, whose listed sites are all offline: its link is
--   its Facebook page (https://www.facebook.com/wialvietnam) for now.
--   logo_url is left untouched — logos are re-hosted per environment by
--   `npm run import:affiliates`, which now applies the same roster.
--
--   Retired (set inactive, never deleted): WIAL Indonesia (still listed on
--   the directory, not a WIAL affiliate; wial.co.id no longer resolves) and
--   WIAL Russia (seeded by 20260810000000, never on the directory).
--
--   Generated with:
--     npx tsx scripts/import-directory-affiliates.ts --emit-sql out.sql --skip-logos
--   then dropped the begin;/commit; wrapper (migrations already run in a
--   transaction).
-- ============================================================

update public.chapters set
  status = 'active',
  directory_slug = 'wial-brazil',
  contact_name = 'Magali Gomes',
  address_line1 = 'Rua Urimonduba, 195, Apto 22, Itaim Bibi, São Paulo - Brazil',
  address_line2 = null,
  city = 'São Paulo',
  state_province = 'Sao Paulo',
  postal_code = '04530080',
  facebook_url = 'http://www.facebook.com/wialbr',
  linkedin_url = 'http://www.linkedin.com/in/wialbrasil',
  youtube_url = 'http://www.youtube.com/user/WialBrasil',
  blog_url = null,
  website_url = coalesce('http://www.wial.org.br/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Brazil'),
  region = coalesce(region, 'South America'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Brazil.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-brazil' or (directory_slug is null and (subdomain = 'brazil' or lower(name) = lower('WIAL Brazil')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Brazil', 'brazil', 'en', 'en', 'active', 'magali@klavia.com.br', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Brazil.', 'South America', 'Brazil', 'Action Learning programs, events, and coach certification in Brazil.', 'http://www.wial.org.br/', null, 'wial-brazil', 'Magali Gomes', 'Rua Urimonduba, 195, Apto 22, Itaim Bibi, São Paulo - Brazil', null, 'São Paulo', 'Sao Paulo', '04530080', 'http://www.facebook.com/wialbr', 'http://www.linkedin.com/in/wialbrasil', 'http://www.youtube.com/user/WialBrasil', null
where not exists (select 1 from public.chapters where directory_slug = 'wial-brazil' or (directory_slug is null and (subdomain = 'brazil' or lower(name) = lower('WIAL Brazil'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-cambodia',
  contact_name = 'Chhayrotana Prak',
  address_line1 = '#9A, St 370',
  address_line2 = 'Sangkat Boeng Kengkang I, Khan Chomkarmorn',
  city = 'Phnom Penh',
  state_province = 'Phnom Penh',
  postal_code = '855',
  facebook_url = 'https://www.facebook.com/WIALCambodia',
  linkedin_url = 'https://www.linkedin.com/company/wialcambodia',
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://wialcambodia.com/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Cambodia'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Cambodia.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-cambodia' or (directory_slug is null and (subdomain = 'cambodia' or lower(name) = lower('WIAL Cambodia')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Cambodia', 'cambodia', 'en', 'en', 'active', 'info@wialcambodia.com', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Cambodia.', 'Asia Pacific', 'Cambodia', 'Action Learning programs, events, and coach certification in Cambodia.', 'http://wialcambodia.com/', null, 'wial-cambodia', 'Chhayrotana Prak', '#9A, St 370', 'Sangkat Boeng Kengkang I, Khan Chomkarmorn', 'Phnom Penh', 'Phnom Penh', '855', 'https://www.facebook.com/WIALCambodia', 'https://www.linkedin.com/company/wialcambodia', null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-cambodia' or (directory_slug is null and (subdomain = 'cambodia' or lower(name) = lower('WIAL Cambodia'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-canada',
  contact_name = 'Rogier ten Kate, Country Director',
  address_line1 = '53 Bedell Cres',
  address_line2 = null,
  city = 'Whitby',
  state_province = '53',
  postal_code = 'L1R 2N7',
  facebook_url = null,
  linkedin_url = 'https://www.linkedin.com/in/rogier-ten-kate-3aa1531/',
  youtube_url = null,
  blog_url = null,
  website_url = coalesce(null, website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Canada'),
  region = coalesce(region, 'North America'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Canada.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-canada' or (directory_slug is null and (subdomain = 'canada' or lower(name) = lower('WIAL Canada')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Canada', 'canada', 'en', 'en', 'active', 'info@actionlearning.ca', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Canada.', 'North America', 'Canada', 'Action Learning programs, events, and coach certification in Canada.', null, null, 'wial-canada', 'Rogier ten Kate, Country Director', '53 Bedell Cres', null, 'Whitby', '53', 'L1R 2N7', null, 'https://www.linkedin.com/in/rogier-ten-kate-3aa1531/', null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-canada' or (directory_slug is null and (subdomain = 'canada' or lower(name) = lower('WIAL Canada'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-china',
  contact_name = 'Christina Zhou',
  address_line1 = '702 Zone G, Vanke Xuhui Center, 9335 Hu Min Road',
  address_line2 = null,
  city = 'Xuhui District',
  state_province = 'Nanning Road',
  postal_code = '200235',
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://www.wial-china.org/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'China'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in China.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-china' or (directory_slug is null and (subdomain = 'china' or lower(name) = lower('WIAL China')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL China', 'china', 'en', 'en', 'active', 'christinazhou@wial-china.org', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in China.', 'Asia Pacific', 'China', 'Action Learning programs, events, and coach certification in China.', 'http://www.wial-china.org/', null, 'wial-china', 'Christina Zhou', '702 Zone G, Vanke Xuhui Center, 9335 Hu Min Road', null, 'Xuhui District', 'Nanning Road', '200235', null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-china' or (directory_slug is null and (subdomain = 'china' or lower(name) = lower('WIAL China'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-france',
  contact_name = 'Daniel Belet',
  address_line1 = 'BP.80016',
  address_line2 = null,
  city = 'LA Brède',
  state_province = 'Aquitaine',
  postal_code = '33652 La Brède cedex',
  facebook_url = null,
  linkedin_url = 'https://www.linkedin.com/in/philipperion/',
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://www.wial.fr/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'France'),
  region = coalesce(region, 'Europe'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in France.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-france' or (directory_slug is null and (subdomain = 'france' or lower(name) = lower('WIAL France')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL France', 'france', 'en', 'en', 'active', 'actionlearning@wial.fr', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in France.', 'Europe', 'France', 'Action Learning programs, events, and coach certification in France.', 'http://www.wial.fr/', null, 'wial-france', 'Daniel Belet', 'BP.80016', null, 'LA Brède', 'Aquitaine', '33652 La Brède cedex', null, 'https://www.linkedin.com/in/philipperion/', null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-france' or (directory_slug is null and (subdomain = 'france' or lower(name) = lower('WIAL France'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-italy',
  contact_name = null,
  address_line1 = null,
  address_line2 = null,
  city = null,
  state_province = null,
  postal_code = null,
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce(null, website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Italy'),
  region = coalesce(region, 'Europe'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Italy.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-italy' or (directory_slug is null and (subdomain = 'italy' or lower(name) = lower('WIAL Italy')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Italy', 'italy', 'en', 'en', 'active', 'info@wial.org', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Italy.', 'Europe', 'Italy', 'Action Learning programs, events, and coach certification in Italy.', null, null, 'wial-italy', null, null, null, null, null, null, null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-italy' or (directory_slug is null and (subdomain = 'italy' or lower(name) = lower('WIAL Italy'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-japan',
  contact_name = 'Fumiyo Seimiya',
  address_line1 = null,
  address_line2 = null,
  city = null,
  state_province = null,
  postal_code = null,
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce(null, website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Japan'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Japan.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-japan' or (directory_slug is null and (subdomain = 'japan' or lower(name) = lower('WIAL Japan')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Japan', 'japan', 'en', 'en', 'active', 'fumiyo.seimiya@gmail.com', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Japan.', 'Asia Pacific', 'Japan', 'Action Learning programs, events, and coach certification in Japan.', null, null, 'wial-japan', 'Fumiyo Seimiya', null, null, null, null, null, null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-japan' or (directory_slug is null and (subdomain = 'japan' or lower(name) = lower('WIAL Japan'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-malaysia',
  contact_name = 'William Teo',
  address_line1 = null,
  address_line2 = null,
  city = 'Kuala Lumpur',
  state_province = 'Wilayah Persekutuan Kuala Lumpur',
  postal_code = '52200',
  facebook_url = 'http://www.facebook.com/WIALMalaysia/',
  linkedin_url = 'https://www.linkedin.com/in/william-teo-23b5a218/',
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://www.wialmalaysia.com/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Malaysia'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Malaysia.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-malaysia' or (directory_slug is null and (subdomain = 'malaysia' or lower(name) = lower('WIAL Malaysia')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Malaysia', 'malaysia', 'en', 'en', 'active', 'william@wialmalaysia.com', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Malaysia.', 'Asia Pacific', 'Malaysia', 'Action Learning programs, events, and coach certification in Malaysia.', 'http://www.wialmalaysia.com/', null, 'wial-malaysia', 'William Teo', null, null, 'Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur', '52200', 'http://www.facebook.com/WIALMalaysia/', 'https://www.linkedin.com/in/william-teo-23b5a218/', null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-malaysia' or (directory_slug is null and (subdomain = 'malaysia' or lower(name) = lower('WIAL Malaysia'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-netherlands',
  contact_name = 'Twan Paes',
  address_line1 = 'Dynahouse',
  address_line2 = 'Perkinsbaan 11',
  city = 'Nieuwegein',
  state_province = 'Utrecht',
  postal_code = '3439 ND',
  facebook_url = null,
  linkedin_url = 'https://www.linkedin.com/company/wialnl/',
  youtube_url = 'https://www.youtube.com/channel/UCVqsJW2T5l1PMT9HnajR3lA/featured',
  blog_url = null,
  website_url = coalesce('http://www.wialnl.nl/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Netherlands'),
  region = coalesce(region, 'Europe'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Netherlands.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-netherlands' or (directory_slug is null and (subdomain = 'netherlands' or lower(name) = lower('WIAL Netherlands')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Netherlands', 'netherlands', 'en', 'en', 'active', 'info@wialnl.nl', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Netherlands.', 'Europe', 'Netherlands', 'Action Learning programs, events, and coach certification in Netherlands.', 'http://www.wialnl.nl/', null, 'wial-netherlands', 'Twan Paes', 'Dynahouse', 'Perkinsbaan 11', 'Nieuwegein', 'Utrecht', '3439 ND', null, 'https://www.linkedin.com/company/wialnl/', 'https://www.youtube.com/channel/UCVqsJW2T5l1PMT9HnajR3lA/featured', null
where not exists (select 1 from public.chapters where directory_slug = 'wial-netherlands' or (directory_slug is null and (subdomain = 'netherlands' or lower(name) = lower('WIAL Netherlands'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-nigeria',
  contact_name = null,
  address_line1 = '1 BOLA SONOIKI AVENUE',
  address_line2 = 'OGUDU GRA',
  city = 'Lagos state',
  state_province = 'Lagos',
  postal_code = '100242',
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce(null, website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Nigeria'),
  region = coalesce(region, 'Africa'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Nigeria.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-nigeria' or (directory_slug is null and (subdomain = 'nigeria' or lower(name) = lower('WIAL Nigeria')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Nigeria', 'nigeria', 'en', 'en', 'active', 'WIAL.NIGERIA@gmail.com', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Nigeria.', 'Africa', 'Nigeria', 'Action Learning programs, events, and coach certification in Nigeria.', null, null, 'wial-nigeria', null, '1 BOLA SONOIKI AVENUE', 'OGUDU GRA', 'Lagos state', 'Lagos', '100242', null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-nigeria' or (directory_slug is null and (subdomain = 'nigeria' or lower(name) = lower('WIAL Nigeria'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-philippines',
  contact_name = 'Cristina Alafriz',
  address_line1 = '4F Jose Cojuangco & Sons Building, 119 Dela Rosa corner Castro Streets',
  address_line2 = 'Legaspi Village',
  city = 'Makati City',
  state_province = null,
  postal_code = null,
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce(null, website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Philippines'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Philippines.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-philippines' or (directory_slug is null and (subdomain = 'philippines' or lower(name) = lower('WIAL Philippines')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Philippines', 'philippines', 'en', 'en', 'active', 'countryrep@wial.ph', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Philippines.', 'Asia Pacific', 'Philippines', 'Action Learning programs, events, and coach certification in Philippines.', null, null, 'wial-philippines', 'Cristina Alafriz', '4F Jose Cojuangco & Sons Building, 119 Dela Rosa corner Castro Streets', 'Legaspi Village', 'Makati City', null, null, null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-philippines' or (directory_slug is null and (subdomain = 'philippines' or lower(name) = lower('WIAL Philippines'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-poland',
  contact_name = 'Tomasz Janiak',
  address_line1 = null,
  address_line2 = null,
  city = 'Warsaw',
  state_province = 'Masovian Voivodeship',
  postal_code = null,
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://wialpoland.org/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Poland'),
  region = coalesce(region, 'Europe'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Poland.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-poland' or (directory_slug is null and (subdomain = 'poland' or lower(name) = lower('WIAL Poland')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Poland', 'poland', 'en', 'en', 'active', 'info@wialpoland.org', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Poland.', 'Europe', 'Poland', 'Action Learning programs, events, and coach certification in Poland.', 'http://wialpoland.org/', null, 'wial-poland', 'Tomasz Janiak', null, null, 'Warsaw', 'Masovian Voivodeship', null, null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-poland' or (directory_slug is null and (subdomain = 'poland' or lower(name) = lower('WIAL Poland'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-singapore',
  contact_name = 'Choon Seng Ng',
  address_line1 = '1 Scotts Rd',
  address_line2 = null,
  city = 'Singapore',
  state_province = null,
  postal_code = null,
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://www.wial.sg/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Singapore'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Singapore.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-singapore' or (directory_slug is null and (subdomain = 'singapore' or lower(name) = lower('WIAL Singapore')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Singapore', 'singapore', 'en', 'en', 'active', 'isajam62@gmail.com', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Singapore.', 'Asia Pacific', 'Singapore', 'Action Learning programs, events, and coach certification in Singapore.', 'http://www.wial.sg/', null, 'wial-singapore', 'Choon Seng Ng', '1 Scotts Rd', null, 'Singapore', null, null, null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-singapore' or (directory_slug is null and (subdomain = 'singapore' or lower(name) = lower('WIAL Singapore'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-taiwan',
  contact_name = 'Paulina Chu',
  address_line1 = null,
  address_line2 = null,
  city = 'Taipei',
  state_province = null,
  postal_code = '104',
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://www.wial.org.tw/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Taiwan'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Taiwan.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-taiwan' or (directory_slug is null and (subdomain = 'taiwan' or lower(name) = lower('WIAL Taiwan')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Taiwan', 'taiwan', 'en', 'en', 'active', 'info@wial.org.tw', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Taiwan.', 'Asia Pacific', 'Taiwan', 'Action Learning programs, events, and coach certification in Taiwan.', 'http://www.wial.org.tw/', null, 'wial-taiwan', 'Paulina Chu', null, null, 'Taipei', null, '104', null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-taiwan' or (directory_slug is null and (subdomain = 'taiwan' or lower(name) = lower('WIAL Taiwan'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-thailand',
  contact_name = 'Peter Cauwelier',
  address_line1 = '41/99-41/100 Soi Sukhumvit 46',
  address_line2 = 'Prakanong Klongtoey',
  city = 'Bangkok',
  state_province = 'Krung Thep Maha Nakhon',
  postal_code = '10110',
  facebook_url = 'https://www.facebook.com/Wialthailand/',
  linkedin_url = 'https://www.linkedin.com/company/world-institute-for-action-learning-thailand',
  youtube_url = 'https://www.youtube.com/channel/UCTaPWY27PpvV3m-UT0e0rKA',
  blog_url = 'http://www.teamasone.com/',
  website_url = coalesce('http://www.wialthailand.com/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Thailand'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Thailand.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-thailand' or (directory_slug is null and (subdomain = 'thailand' or lower(name) = lower('WIAL Thailand')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Thailand', 'thailand', 'en', 'en', 'active', 'peerawan@wialthailand.com', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Thailand.', 'Asia Pacific', 'Thailand', 'Action Learning programs, events, and coach certification in Thailand.', 'http://www.wialthailand.com/', null, 'wial-thailand', 'Peter Cauwelier', '41/99-41/100 Soi Sukhumvit 46', 'Prakanong Klongtoey', 'Bangkok', 'Krung Thep Maha Nakhon', '10110', 'https://www.facebook.com/Wialthailand/', 'https://www.linkedin.com/company/world-institute-for-action-learning-thailand', 'https://www.youtube.com/channel/UCTaPWY27PpvV3m-UT0e0rKA', 'http://www.teamasone.com/'
where not exists (select 1 from public.chapters where directory_slug = 'wial-thailand' or (directory_slug is null and (subdomain = 'thailand' or lower(name) = lower('WIAL Thailand'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-usa',
  contact_name = 'Bea Carson',
  address_line1 = 'P.O. Box 7601',
  address_line2 = 'PMB-28451',
  city = 'Washington',
  state_province = 'District of Columbia',
  postal_code = '20044',
  facebook_url = null,
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('http://www.wial-usa.org/', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'United States'),
  region = coalesce(region, 'North America'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in the United States.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-usa' or (directory_slug is null and (subdomain = 'usa' or lower(name) = lower('WIAL USA')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL USA', 'usa', 'en', 'en', 'active', 'craig.senecal@wial-usa.org', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in the United States.', 'North America', 'United States', 'Action Learning programs, events, and coach certification in the United States.', 'http://www.wial-usa.org/', null, 'wial-usa', 'Bea Carson', 'P.O. Box 7601', 'PMB-28451', 'Washington', 'District of Columbia', '20044', null, null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-usa' or (directory_slug is null and (subdomain = 'usa' or lower(name) = lower('WIAL USA'))));
update public.chapters set
  status = 'active',
  directory_slug = 'wial-vietnam',
  contact_name = 'Mr Nguyen Duy Minh (John)',
  address_line1 = 'Floor 7, Melinh Point Tower',
  address_line2 = '2 Ngo Duc Ke, Dist 1',
  city = 'Ho Chi Minh City',
  state_province = 'Hồ Chí Minh',
  postal_code = null,
  facebook_url = 'https://www.facebook.com/wialvietnam',
  linkedin_url = null,
  youtube_url = null,
  blog_url = null,
  website_url = coalesce('https://www.facebook.com/wialvietnam', website_url),
  logo_url = coalesce(null, logo_url),
  country = coalesce(country, 'Vietnam'),
  region = coalesce(region, 'Asia Pacific'),
  description = coalesce(nullif(description, ''), 'Action Learning programs, events, and coach certification in Vietnam.'),
  updated_at = timezone('utc', now())
where directory_slug = 'wial-vietnam' or (directory_slug is null and (subdomain = 'vietnam' or lower(name) = lower('WIAL Vietnam')));
insert into public.chapters (name, subdomain, locale, language, status, contact_email, theme_json, config, tagline, region, country, description, website_url, logo_url, directory_slug, contact_name, address_line1, address_line2, city, state_province, postal_code, facebook_url, linkedin_url, youtube_url, blog_url)
select 'WIAL Vietnam', 'vietnam', 'en', 'en', 'active', 'wialvietnam@gmail.com', '{}'::jsonb, '{}'::jsonb, 'Action Learning programs, events, and coach certification in Vietnam.', 'Asia Pacific', 'Vietnam', 'Action Learning programs, events, and coach certification in Vietnam.', 'https://www.facebook.com/wialvietnam', null, 'wial-vietnam', 'Mr Nguyen Duy Minh (John)', 'Floor 7, Melinh Point Tower', '2 Ngo Duc Ke, Dist 1', 'Ho Chi Minh City', 'Hồ Chí Minh', null, 'https://www.facebook.com/wialvietnam', null, null, null
where not exists (select 1 from public.chapters where directory_slug = 'wial-vietnam' or (directory_slug is null and (subdomain = 'vietnam' or lower(name) = lower('WIAL Vietnam'))));
-- Retired: still listed on the directory or seeded earlier, but not on WIAL's affiliate roster.
update public.chapters set
  status = 'inactive',
  updated_at = timezone('utc', now())
where status = 'active'
  and (directory_slug in ('wial-indonesia') or subdomain in ('russia', 'indonesia'));
