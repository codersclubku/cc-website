create extension if not exists "pgcrypto";

create table if not exists public.admin_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles
    where user_id = check_user_id
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, anon;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  usn text unique not null,
  department text not null,
  year text not null,
  semester text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_usn on public.profiles(lower(usn));
create index if not exists idx_profiles_dept on public.profiles(department);
create index if not exists idx_profiles_year on public.profiles(year);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  notice_version text not null,
  purpose text not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create index if not exists idx_consents_student on public.consents(student_id);

create sequence if not exists public.registration_seq start with 1;

create table if not exists public.registrations_new (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  confirmation_id text unique not null,
  status text not null default 'registered' check (status in ('registered', 'cancelled', 'waitlisted')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  constraint unique_event_student unique (event_id, student_id)
);

create table if not exists public.export_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  filters jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_export_log_admin on public.export_log(admin_id);
create index if not exists idx_export_log_created on public.export_log(created_at desc);

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
    insert into public.admin_roles (user_id, role, created_at)
    select user_id, role, created_at from public.user_roles where role = 'admin'
    on conflict do nothing;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'registrations') then
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'registrations' and column_name = 'student_id') then
      alter table public.registrations rename to registrations_legacy;
      alter table public.registrations_new rename to registrations;
    else
      drop table public.registrations_new;
    end if;
  else
    alter table public.registrations_new rename to registrations;
  end if;
end $$;

create index if not exists idx_registrations_event on public.registrations(event_id);
create index if not exists idx_registrations_student on public.registrations(student_id);
create index if not exists idx_registrations_conf on public.registrations(confirmation_id);
create index if not exists idx_registrations_status on public.registrations(status);

alter table public.profiles enable row level security;
alter table public.registrations enable row level security;
alter table public.consents enable row level security;
alter table public.admin_roles enable row level security;
alter table public.export_log enable row level security;

drop policy if exists "Students read own profile" on public.profiles;
create policy "Students read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Students insert own profile" on public.profiles;
create policy "Students insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Students update own profile" on public.profiles;
create policy "Students update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()))
  with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Admins delete profiles" on public.profiles;
create policy "Admins delete profiles"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists "Students read own registrations" on public.registrations;
create policy "Students read own registrations"
  on public.registrations
  for select
  to authenticated
  using (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Students insert own registrations" on public.registrations;
create policy "Students insert own registrations"
  on public.registrations
  for insert
  to authenticated
  with check (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Students update own registrations" on public.registrations;
create policy "Students update own registrations"
  on public.registrations
  for update
  to authenticated
  using (student_id = auth.uid() or public.is_admin(auth.uid()))
  with check (
    (student_id = auth.uid() and status = 'cancelled')
    or public.is_admin(auth.uid())
  );

drop policy if exists "Students view own consents" on public.consents;
create policy "Students view own consents"
  on public.consents
  for select
  to authenticated
  using (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Students insert own consents" on public.consents;
create policy "Students insert own consents"
  on public.consents
  for insert
  to authenticated
  with check (student_id = auth.uid());

drop policy if exists "Students update own consents" on public.consents;
create policy "Students update own consents"
  on public.consents
  for update
  to authenticated
  using (student_id = auth.uid() or public.is_admin(auth.uid()))
  with check (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins read admin_roles" on public.admin_roles;
create policy "Admins read admin_roles"
  on public.admin_roles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins manage export_log" on public.export_log;
create policy "Admins manage export_log"
  on public.export_log
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.check_registration_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_current_count integer;
begin
  select * into v_event
  from public.events
  where id = NEW.event_id
  for update;

  if not found then
    raise exception 'EVENT_NOT_FOUND: Event does not exist';
  end if;

  if v_event.status != 'published' then
    raise exception 'EVENT_NOT_PUBLISHED: Registration is not open for this event';
  end if;

  if now() > v_event.registration_deadline then
    raise exception 'EVENT_CLOSED: Registration deadline has passed';
  end if;

  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then
    raise exception 'EVENT_NOT_YET_OPEN: Registration has not opened yet';
  end if;

  if NEW.status = 'registered' and v_event.capacity is not null then
    select count(*) into v_current_count
    from public.registrations
    where event_id = NEW.event_id
      and status = 'registered'
      and id != coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if v_current_count >= v_event.capacity then
      raise exception 'EVENT_FULL: This event has reached maximum capacity';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_check_registration_capacity on public.registrations;
create trigger trg_check_registration_capacity
  before insert or update of event_id, status
  on public.registrations
  for each row
  execute function public.check_registration_capacity();

create or replace function public.register_student_atomic(
  p_event_id uuid,
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_count integer;
  v_conf_id text;
  v_year_str text;
  v_seq integer;
  v_existing record;
  v_new_id uuid;
begin
  if auth.uid() is distinct from p_student_id and not public.is_admin(auth.uid()) then
    return jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  end if;

  if not exists (select 1 from auth.users where id = p_student_id and email_confirmed_at is not null) then
    return jsonb_build_object('success', false, 'code', 'EMAIL_NOT_VERIFIED', 'message', 'Please verify your email before registering for events');
  end if;

  select * into v_existing
  from public.registrations
  where event_id = p_event_id and student_id = p_student_id;

  if found then
    if v_existing.status = 'registered' then
      return jsonb_build_object(
        'success', false,
        'code', 'ALREADY_REGISTERED',
        'message', 'You are already registered for this event',
        'confirmation_id', v_existing.confirmation_id
      );
    elsif v_existing.status = 'cancelled' then
      update public.registrations
      set status = 'registered', created_at = now()
      where id = v_existing.id;

      return jsonb_build_object(
        'success', true,
        'code', 'REGISTRATION_REACTIVATED',
        'message', 'Registration confirmed',
        'confirmation_id', v_existing.confirmation_id
      );
    end if;
  end if;

  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found or v_event.status != 'published' then
    return jsonb_build_object('success', false, 'code', 'EVENT_NOT_AVAILABLE', 'message', 'Event is not available for registration');
  end if;

  if now() > v_event.registration_deadline then
    return jsonb_build_object('success', false, 'code', 'EVENT_CLOSED', 'message', 'Registration for this event has closed');
  end if;

  if v_event.registration_opens_at is not null and now() < v_event.registration_opens_at then
    return jsonb_build_object('success', false, 'code', 'NOT_YET_OPEN', 'message', 'Registration is not yet open');
  end if;

  if v_event.capacity is not null then
    select count(*) into v_count
    from public.registrations
    where event_id = p_event_id and status = 'registered';

    if v_count >= v_event.capacity then
      return jsonb_build_object('success', false, 'code', 'EVENT_FULL', 'message', 'Event is at full capacity');
    end if;
  end if;

  v_year_str := to_char(now(), 'YYYY');
  v_seq := nextval('public.registration_seq');
  v_conf_id := 'CC-' || v_year_str || '-' || lpad(v_seq::text, 4, '0');

  insert into public.registrations (event_id, student_id, confirmation_id, status)
  values (p_event_id, p_student_id, v_conf_id, 'registered')
  returning id into v_new_id;

  return jsonb_build_object(
    'success', true,
    'code', 'REGISTERED',
    'message', 'Successfully registered for event',
    'registration_id', v_new_id,
    'confirmation_id', v_conf_id,
    'event_title', v_event.title
  );
exception
  when others then
    return jsonb_build_object('success', false, 'code', 'ERROR', 'message', SQLERRM);
end;
$$;

revoke all on function public.register_student_atomic(uuid, uuid) from public;
grant execute on function public.register_student_atomic(uuid, uuid) to authenticated;

create or replace function public.cancel_registration_atomic(
  p_event_id uuid,
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg record;
begin
  if auth.uid() is distinct from p_student_id and not public.is_admin(auth.uid()) then
    return jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  end if;

  select * into v_reg
  from public.registrations
  where event_id = p_event_id and student_id = p_student_id;

  if not found then
    return jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Registration record not found');
  end if;

  update public.registrations
  set status = 'cancelled'
  where id = v_reg.id;

  return jsonb_build_object('success', true, 'code', 'CANCELLED', 'message', 'Registration cancelled successfully');
end;
$$;

revoke all on function public.cancel_registration_atomic(uuid, uuid) from public;
grant execute on function public.cancel_registration_atomic(uuid, uuid) to authenticated;

create or replace function public.delete_student_account(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_student_id and not public.is_admin(auth.uid()) then
    return jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  end if;

  delete from public.consents where student_id = p_student_id;
  delete from public.registrations where student_id = p_student_id;
  delete from public.profiles where id = p_student_id;
  delete from auth.users where id = p_student_id;

  return jsonb_build_object('success', true, 'code', 'DELETED', 'message', 'Account deleted successfully');
end;
$$;

revoke all on function public.delete_student_account(uuid) from public;
grant execute on function public.delete_student_account(uuid) to authenticated;
