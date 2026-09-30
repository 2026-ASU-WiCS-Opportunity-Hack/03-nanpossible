-- Affiliate heads (chapter_admin) must be linked to an affiliate (issue #41).
--
-- Accounts promoted through the old CLI, the Supabase dashboard, or raw SQL
-- ended up as chapter_admin with chapter_id NULL and landed on an empty
-- /admin/chapter. This trigger refuses any transition INTO that state. Rows
-- that are already stranded keep saving unrelated edits (name, phone, email)
-- until a platform admin fixes them from /admin/global/users.
create or replace function public.enforce_chapter_admin_has_chapter()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> 'chapter_admin' or new.chapter_id is not null then
    return new;
  end if;

  -- Already-stranded rows may still save edits that do not touch role/chapter.
  if tg_op = 'UPDATE'
     and old.role = new.role
     and old.chapter_id is not distinct from new.chapter_id then
    return new;
  end if;

  -- INSERT ... ON CONFLICT DO UPDATE fires BEFORE INSERT even when the row
  -- already exists (syncUserAccess, handle_auth_user_created,
  -- sync_public_user_email all upsert). Let the UPDATE branch decide.
  if tg_op = 'INSERT' and exists (select 1 from public.users where id = new.id) then
    return new;
  end if;

  raise exception 'Affiliate heads (chapter_admin) must be linked to an affiliate (user %)', new.id
    using errcode = 'check_violation',
          hint = 'Set users.chapter_id or change the role. In the app: Admin -> Users & roles -> Edit -> Primary affiliate.';
end;
$$;

drop trigger if exists users_chapter_admin_requires_chapter on public.users;
create trigger users_chapter_admin_requires_chapter
before insert or update of role, chapter_id on public.users
for each row execute procedure public.enforce_chapter_admin_has_chapter();

-- Re-sync the JWT app_metadata when only chapter_id changes (a platform admin
-- fixing a stranded head from SQL or the Table Editor), not just on role
-- changes. RLS reads the chapter from the JWT via current_app_chapter_id().
-- Loop-safe: the auth -> public echo returns early when the role text is
-- unchanged, and the public -> auth echo returns early when both are unchanged.
create or replace function public.sync_role_to_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = new.role and old.chapter_id is not distinct from new.chapter_id then
    return new;
  end if;

  perform public.sync_auth_user_role(new.id, new.role, new.chapter_id);
  return new;
end;
$$;

drop trigger if exists on_public_user_role_synced on public.users;
create trigger on_public_user_role_synced
after update of role, chapter_id on public.users
for each row execute procedure public.sync_role_to_auth_metadata();

-- Report (do not auto-demote) rows that are already stranded so the apply log
-- shows how many accounts need attention at /admin/global/users.
do $$
declare
  stranded_count integer;
begin
  select count(*)
  into stranded_count
  from public.users
  where role = 'chapter_admin'
    and chapter_id is null;

  if stranded_count > 0 then
    raise notice '% affiliate head(s) have no affiliate assigned; fix them at /admin/global/users', stranded_count;
  end if;
end;
$$;
