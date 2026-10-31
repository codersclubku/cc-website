create table if not exists public.feedback (
  id text primary key,
  reference_id text not null unique,
  type text not null check (type in ('bug', 'suggestion', 'issue', 'other')),
  title text not null,
  description text not null,
  category text,
  severity text,
  page text,
  steps_to_reproduce text,
  screenshot_url text,
  name text,
  email text,
  reply_requested boolean not null default false,
  anonymous boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'new' check (status in ('new', 'in-review', 'resolved', 'rejected')),
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Allow anonymous feedback submissions"
  on public.feedback
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow admins full access to feedback"
  on public.feedback
  for all
  to authenticated
  using (public.is_admin());
