alter table if exists public.profiles drop column if exists phone;
alter table if exists public.events drop column if exists coordinator_phone;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  department text,
  year text,
  photo text,
  email text,
  linkedin text,
  github text,
  "group" text not null default 'Core Team',
  display_order integer default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "team_members_select_public" on public.team_members
  for select using (true);

create policy "team_members_insert_admin" on public.team_members
  for insert with check (public.is_admin(auth.uid()));

create policy "team_members_update_admin" on public.team_members
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "team_members_delete_admin" on public.team_members
  for delete using (public.is_admin(auth.uid()));

create index if not exists idx_team_members_order on public.team_members(display_order);
