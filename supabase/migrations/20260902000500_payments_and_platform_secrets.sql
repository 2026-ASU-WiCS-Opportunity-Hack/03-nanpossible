-- ============================================================
-- Migration: Platform secrets (Supabase Vault) + payments ledger
-- Date: 2026-09-02
-- Description:
--   /pay lets anyone pay WIAL through Stripe Checkout, and platform admins
--   configure the Stripe secret key from /admin/global/payments instead of
--   the STRIPE_SECRET_KEY env var (which stays as a fallback).
--
--   * The key is stored encrypted in Supabase Vault. The three wrapper
--     functions below are the only way the app touches vault.*: they are
--     SECURITY DEFINER and executable by service_role only, so anon and
--     authenticated clients can never read a secret.
--   * `stripe_payments` records every completed Checkout Session (one row per
--     session; re-verifying the same session is idempotent). Payers who were
--     signed in can read their own rows; everything else is service-role.
--     (The older chapter-scoped `payments` table from the foundation
--     migration is unrelated and unused by the app.)
-- ============================================================

create or replace function public.set_platform_secret(p_name text, p_value text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_id uuid;
begin
    if p_name is null or length(trim(p_name)) = 0 then
        raise exception 'secret name is required';
    end if;
    select id into v_id from vault.secrets where name = p_name;
    if v_id is null then
        perform vault.create_secret(p_value, p_name, 'Platform setting managed from /admin/global/payments');
    else
        perform vault.update_secret(v_id, p_value, p_name, 'Platform setting managed from /admin/global/payments');
    end if;
end;
$$;

create or replace function public.get_platform_secret(p_name text)
returns text
language sql
security definer
set search_path = ''
stable
as $$
    select decrypted_secret from vault.decrypted_secrets where name = p_name limit 1;
$$;

create or replace function public.clear_platform_secret(p_name text)
returns void
language sql
security definer
set search_path = ''
as $$
    delete from vault.secrets where name = p_name;
$$;

revoke all on function public.set_platform_secret(text, text) from public, anon, authenticated;
revoke all on function public.get_platform_secret(text) from public, anon, authenticated;
revoke all on function public.clear_platform_secret(text) from public, anon, authenticated;
grant execute on function public.set_platform_secret(text, text) to service_role;
grant execute on function public.get_platform_secret(text) to service_role;
grant execute on function public.clear_platform_secret(text) to service_role;

create table if not exists public.stripe_payments (
    id uuid primary key default gen_random_uuid(),
    stripe_session_id text not null unique,
    stripe_payment_intent_id text,
    stripe_price_id text,
    stripe_product_id text,
    product_name text not null,
    amount_total integer not null,
    currency text not null,
    payer_email text,
    payer_name text,
    user_id uuid references auth.users (id) on delete set null,
    chapter_id uuid references public.chapters (id) on delete set null,
    status text not null default 'paid',
    metadata jsonb not null default '{}'::jsonb,
    paid_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists stripe_payments_created_at_idx on public.stripe_payments (created_at desc);
create index if not exists stripe_payments_user_id_idx on public.stripe_payments (user_id);

alter table public.stripe_payments enable row level security;

drop policy if exists "Users can view their own Stripe payments" on public.stripe_payments;
create policy "Users can view their own Stripe payments"
    on public.stripe_payments
    for select
    to authenticated
    using (user_id = auth.uid());

grant select on public.stripe_payments to authenticated;
grant all on public.stripe_payments to service_role;

notify pgrst, 'reload schema';
