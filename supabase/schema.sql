-- Supabase SQL: выполните в Dashboard → SQL Editor

create table if not exists public.budget_rooms (
  id uuid primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists budget_rooms_updated_at_idx on public.budget_rooms (updated_at desc);

alter table public.budget_rooms enable row level security;

create policy "budget_rooms_select" on public.budget_rooms
  for select to anon, authenticated using (true);

create policy "budget_rooms_insert" on public.budget_rooms
  for insert to anon, authenticated with check (true);

create policy "budget_rooms_update" on public.budget_rooms
  for update to anon, authenticated using (true) with check (true);

-- Realtime: Dashboard → Database → Replication → включить budget_rooms
-- или: alter publication supabase_realtime add table public.budget_rooms;
