alter table public.contact_messages
  add column if not exists country text,
  add column if not exists about text;