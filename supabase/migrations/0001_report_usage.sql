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
create policy "read own usage" on public.report_usage
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Users may insert only their own usage rows (reservation goes through
-- the RLS-scoped session, so no service key is needed for reserving).
create policy "insert own usage" on public.report_usage
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Deliberately NO update or delete policies: clients cannot erase their
-- own usage history, which would bypass the 3-per-day quota.
-- (Refunds use the server-side secret key only — Task 7.)

grant select, insert on table public.report_usage to authenticated;
