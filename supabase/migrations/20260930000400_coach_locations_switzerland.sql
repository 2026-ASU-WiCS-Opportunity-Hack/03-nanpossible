-- Two directory.wial.org profiles list Switzerland as the country although
-- neither coach is based there. Averaging Montreal into the Swiss map anchor
-- put the Switzerland dot in the middle of the Atlantic on the landing page.
-- The importer's LOCATION_OVERRIDES (scripts/import-directory-coaches.ts)
-- carries the same corrections so a re-import cannot restore the directory
-- values. Guarded on the bad country so admin edits made since are kept.

-- Montreal postcode (H2R), +1 438 phone, "now living in Montreal" bio.
update public.coaches
set location_country = 'Canada',
    location_state = 'Quebec',
    location = 'Montreal, Canada',
    updated_at = timezone('utc', now())
where slug = 'gil-vaillant'
  and location_country = 'Switzerland';

-- IFRC Antananarivo (Madagascar postcode 101, 032 mobile). The directory had
-- geocoded the profile at Switzerland's centroid, so use the city's coordinates.
update public.coaches
set location_city = 'Antananarivo',
    location_state = null,
    location_country = 'Madagascar',
    location = 'Antananarivo, Madagascar',
    location_lat = -18.8792,
    location_lng = 47.5079,
    updated_at = timezone('utc', now())
where slug = 'jean-eugene-injerona'
  and location_country = 'Switzerland';
