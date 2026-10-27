-- report_usage: metadata-only quota ledger.
-- Report contents are NEVER stored — only who, when, and text-or-image.
create table if not exists public.report_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('text', 'image')),
  created_at timestamptz not null default now()
);

create index if not exists report_usage_user_created_idx
  on public.report_usage (user_id, created_at desc);

alter table public.report_usage enable row level security;

-- Users may read only their own usage rows (for the quota counter).
drop policy if exists "read own usage" on public.report_usage;
create policy "read own usage" on public.report_usage
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Users may insert only their own usage rows (reservation goes through
-- the RLS-scoped session, so no service key is needed for reserving).
drop policy if exists "insert own usage" on public.report_usage;
create policy "insert own usage" on public.report_usage
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Deliberately NO update or delete policies: clients cannot erase their
-- own usage history, which would bypass the 3-per-day quota.
-- (Refunds use the server-side secret key only.)

grant select, insert on table public.report_usage to authenticated;

-- Refunds run from the server with the secret key (role service_role): it
-- needs to read/count and delete the exact usage row. No insert for it —
-- reservations always go through the RLS-scoped user session.
grant select, delete on table public.report_usage to service_role;

-- Atomic quota reserve ONE statement that counts in-window rows
-- and inserts, serialized per user with an advisory transaction lock so
-- two concurrent requests cannot both take the last free slot.
-- SECURITY INVOKER: RLS still applies to both the count and the insert.
create or replace function public.try_reserve(p_kind text)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_count bigint;
  v_oldest timestamptz;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Serialize concurrent reserves for this user for the rest of the transaction.
  perform pg_advisory_xact_lock(hashtextextended('report_usage:' || auth.uid()::text, 0));

  select count(*), min(created_at)
    into v_count, v_oldest
    from public.report_usage
   where user_id = auth.uid()
     and created_at > now() - interval '24 hours';

  if v_count >= 3 then
    -- At limit: report when the oldest slot ages out. No insert.
    return jsonb_build_object('usage_id', null, 'oldest', v_oldest);
  end if;

  insert into public.report_usage (user_id, kind)
  values (auth.uid(), p_kind)
  returning id into v_id;

  return jsonb_build_object('usage_id', v_id, 'oldest', null);
end;
$$;

-- Callable by signed-in users only (security invoker would contain it anyway).
revoke execute on function public.try_reserve(text) from public;
grant execute on function public.try_reserve(text) to authenticated;
