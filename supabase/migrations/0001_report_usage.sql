-- report_usage: metadata-only quota ledger.
-- Report contents are NEVER stored — only who, when, and text-or-image.
-- Re-run this whole migration in the Supabase SQL editor when upgrading an
-- existing project: it revokes direct client INSERTs so try_reserve() is the
-- only write path.
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

-- Deliberately NO insert/update/delete policy for clients: the only write
-- path is public.try_reserve() below, which enforces the rolling limit.
-- Direct inserts would let a signed-in user spam unlimited rows through
-- PostgREST even though they cannot raise their own quota.
drop policy if exists "insert own usage" on public.report_usage;

-- Clients can read their own rows, but cannot insert them directly.
-- (Refunds use the server-side secret key only.)
revoke insert on table public.report_usage from anon, authenticated;
grant select on table public.report_usage to authenticated;

-- Refunds run from the server with the secret key (role service_role): it
-- needs to read/count and delete the exact usage row. No insert for it —
-- reservations always go through try_reserve().
grant select, delete on table public.report_usage to service_role;

-- Atomic quota reserve: count in-window rows and insert in one transaction,
-- serialized per user with an advisory transaction lock so two concurrent
-- requests cannot both take the last free slot.
--
-- SECURITY DEFINER is required because clients no longer hold INSERT on the
-- table; the function still scopes every read and write to auth.uid(), and
-- search_path is pinned so the definer rights cannot be redirected.
create or replace function public.try_reserve(p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count bigint;
  v_oldest timestamptz;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_kind not in ('text', 'image') then
    raise exception 'invalid kind';
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

-- Callable by signed-in users only; anonymous callers cannot reserve.
revoke execute on function public.try_reserve(text) from public;
grant execute on function public.try_reserve(text) to authenticated;
