create extension if not exists "pgcrypto";

create sequence if not exists public.registration_seq start with 1;

create table if not exists public.admin_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_caller uuid;
  v_target uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    return false;
  end if;

  v_target := COALESCE(check_user_id, v_caller);

  if v_caller is distinct from v_target then
    if not exists (select 1 from public.admin_roles where user_id = v_caller) then
      raise exception 'UNAUTHORIZED: Cannot inspect administrator status of another user';
    end if;
  end if;

  return exists (
    select 1
    from public.admin_roles
    where user_id = v_target
  );
end;
$$;

create or replace function public.has_role(target_user_id uuid, required_role text)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    return false;
  end if;

  if v_caller is distinct from target_user_id then
    if not exists (select 1 from public.admin_roles where user_id = v_caller) then
      raise exception 'UNAUTHORIZED: Cannot inspect role of another user';
    end if;
  end if;

  return exists (
    select 1
    from public.admin_roles
    where user_id = target_user_id
      and role = required_role
  );
end;
$$;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;
revoke all on function public.has_role(uuid, text) from public, anon;
grant execute on function public.has_role(uuid, text) to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  usn text unique not null,
  department text not null check (
    department in (
      'Computer Science and Engineering',
      'Artificial Intelligence & Data Science',
      'Artificial Intelligence & Machine Learning',
      'Information Science and Engineering',
      'Electronics and Communication Engineering',
      'Electrical and Electronics Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Master of Computer Applications',
      'Other'
    )
  ),
  year text not null check (year in ('1st Year', '2nd Year', '3rd Year', '4th Year')),
  semester text not null check (
    semester in (
      '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
      '5th Semester', '6th Semester', '7th Semester', '8th Semester'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_profiles_usn_format check (
    usn ~ '^(KU[0-9]{4}[A-Z]{2,4}[0-9]{3}|[1-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3})$'
  )
);

create unique index if not exists idx_profiles_usn_unique_case_insensitive
  on public.profiles (lower(trim(usn)));

create or replace function public.guard_profile_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then
    if NEW.id <> OLD.id then
      raise exception 'CANNOT_CHANGE_ID: Profile ID cannot be modified';
    end if;
    if NEW.created_at <> OLD.created_at then
      raise exception 'CANNOT_CHANGE_CREATED_AT: Creation timestamp cannot be modified';
    end if;
    if OLD.usn is not null and OLD.usn <> '' and pg_catalog.upper(pg_catalog.btrim(NEW.usn)) <> pg_catalog.upper(pg_catalog.btrim(OLD.usn)) then
      raise exception 'CANNOT_CHANGE_USN: USN cannot be modified after registration';
    end if;
  end if;
  NEW.updated_at := pg_catalog.now();
  return NEW;
end;
$$;

revoke all on function public.guard_profile_updates() from public, anon, authenticated;

drop trigger if exists trg_guard_profile_updates on public.profiles;
create trigger trg_guard_profile_updates
  before update on public.profiles
  for each row
  execute function public.guard_profile_updates();

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  type text not null default 'Workshop',
  short_description text not null,
  description text not null,
  agenda jsonb default '[]'::jsonb,
  prerequisites text[] default '{}'::text[],
  venue text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  eligibility text not null default 'Kishkinda University students',
  coordinator_name text not null,
  registration_opens_at timestamptz default now(),
  registration_deadline timestamptz not null,
  capacity integer check (capacity is null or capacity > 0),
  allow_waitlist boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  confirmation_id text unique not null,
  status text not null default 'registered' check (status in ('registered', 'cancelled', 'waitlisted')),
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now(),
  registered_by uuid references auth.users(id),
  constraint unique_event_student unique (event_id, student_id)
);

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  notice_version text not null,
  purpose text not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  superseded_at timestamptz,
  superseded_by uuid references public.consents(id) on delete set null
);

create unique index if not exists idx_consents_student_version_active
  on public.consents (student_id, notice_version)
  where withdrawn_at is null and superseded_at is null;

revoke insert, update, delete on public.consents from authenticated, anon;
grant select on public.consents to authenticated;

create table if not exists public.export_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  filters jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  status text not null default 'In progress' check (status in ('Planned', 'In progress', 'Live', 'Archived')),
  tech_stack text[] not null default '{}'::text[],
  repo_url text not null,
  demo_url text,
  how_to_contribute text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  caption text,
  alt_text text not null,
  event_id uuid references public.events(id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  handled boolean not null default false,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_rate_limit (
  id uuid primary key default gen_random_uuid(),
  sender_email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.process_contact_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent_count integer;
  v_clean_email text;
  v_clean_name text;
  v_clean_msg text;
begin
  v_clean_name := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.name), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g');
  v_clean_email := pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(NEW.email), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g'));
  v_clean_msg := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.message), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g');

  if pg_catalog.length(v_clean_name) < 1 or pg_catalog.length(v_clean_name) > 100 then
    raise exception 'INVALID_NAME: Name must be between 1 and 100 characters';
  end if;

  if v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' or pg_catalog.length(v_clean_email) > 100 then
    raise exception 'INVALID_EMAIL: Please provide a valid email address';
  end if;

  if pg_catalog.length(v_clean_msg) < 5 or pg_catalog.length(v_clean_msg) > 2000 then
    raise exception 'INVALID_MESSAGE: Message must be between 5 and 2000 characters';
  end if;

  select count(*) into v_recent_count
  from public.contact_rate_limit
  where sender_email = v_clean_email
    and created_at > (pg_catalog.now() - interval '1 hour');

  if v_recent_count >= 3 then
    raise exception 'RATE_LIMIT_EXCEEDED: Too many messages sent. Please wait an hour before submitting again.';
  end if;

  insert into public.contact_rate_limit (sender_email, created_at)
  values (v_clean_email, pg_catalog.now());

  NEW.name := v_clean_name;
  NEW.email := v_clean_email;
  NEW.message := v_clean_msg;

  return NEW;
end;
$$;

revoke all on function public.process_contact_message() from public, anon, authenticated;

drop trigger if exists trg_process_contact_message on public.contact_messages;
create trigger trg_process_contact_message
  before insert on public.contact_messages
  for each row
  execute function public.process_contact_message();

create or replace function public.check_registration_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
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

  if pg_catalog.now() > v_event.registration_deadline then
    raise exception 'EVENT_CLOSED: Registration deadline has passed';
  end if;

  if v_event.registration_opens_at is not null and pg_catalog.now() < v_event.registration_opens_at then
    raise exception 'EVENT_NOT_YET_OPEN: Registration has not opened yet';
  end if;

  if NEW.status = 'registered' and v_event.capacity is not null then
    select count(*) into v_current_count
    from public.registrations
    where event_id = NEW.event_id
      and status = 'registered'
      and id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if v_current_count >= v_event.capacity then
      raise exception 'EVENT_FULL: This event has reached maximum capacity';
    end if;
  end if;

  return NEW;
end;
$$;

revoke all on function public.check_registration_capacity() from public, anon, authenticated;

drop trigger if exists trg_check_registration_capacity on public.registrations;
create trigger trg_check_registration_capacity
  before insert or update of event_id, status
  on public.registrations
  for each row
  execute function public.check_registration_capacity();

CREATE OR REPLACE FUNCTION public.has_active_consent(
  p_student_id uuid,
  p_version text DEFAULT 'v1.0-2026'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Caller must be signed in';
  END IF;

  IF v_caller IS DISTINCT FROM p_student_id AND NOT public.is_admin(v_caller) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Cannot inspect consent status of another student';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.consents
    WHERE student_id = p_student_id
      AND notice_version = p_version
      AND withdrawn_at IS NULL
      AND superseded_at IS NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_active_consent(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_consent(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_profile_complete(p_student_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Caller must be signed in';
  END IF;

  IF v_caller IS DISTINCT FROM p_student_id AND NOT public.is_admin(v_caller) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Cannot inspect profile completeness of another student';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_student_id
      AND full_name IS NOT NULL AND pg_catalog.btrim(full_name) <> ''
      AND usn IS NOT NULL AND pg_catalog.btrim(usn) <> ''
      AND department IS NOT NULL AND pg_catalog.btrim(department) <> ''
      AND year IS NOT NULL AND pg_catalog.btrim(year) <> ''
      AND semester IS NOT NULL AND pg_catalog.btrim(semester) <> ''
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_profile_complete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_profile_complete(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_student_onboarding(
  p_full_name text,
  p_usn text,
  p_department text,
  p_year text,
  p_semester text,
  p_consent boolean,
  p_version text DEFAULT 'v1.0-2026'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
  v_clean_name text;
  v_clean_usn text;
  v_existing_usn text;
  v_canonical_ver text := 'v1.0-2026';
  v_canonical_purp text := 'Student event registration, attendance verification, and club records under Kishkinda University policy.';
  v_profile_record public.profiles%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Caller must be signed in to complete onboarding';
  END IF;

  IF p_consent IS NOT TRUE THEN
    RAISE EXCEPTION 'CONSENT_REQUIRED: Explicit privacy notice acceptance is required to register a student profile';
  END IF;

  IF p_version IS NULL OR pg_catalog.btrim(p_version) <> v_canonical_ver THEN
    RAISE EXCEPTION 'INVALID_VERSION: Notice version % is invalid. Expected %', COALESCE(p_version, 'NULL'), v_canonical_ver;
  END IF;

  v_clean_name := pg_catalog.btrim(COALESCE(p_full_name, ''));
  v_clean_usn  := pg_catalog.upper(pg_catalog.btrim(COALESCE(p_usn, '')));

  IF pg_catalog.length(v_clean_name) < 2 OR pg_catalog.length(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME: Full name must be between 2 and 100 characters';
  END IF;

  IF v_clean_usn !~ '^(KU[0-9]{4}[A-Z]{2,4}[0-9]{3}|[1-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3})$' THEN
    RAISE EXCEPTION 'INVALID_USN: USN must follow Kishkinda University format (e.g. KU2024CS001) or Karnataka VTU format (e.g. 2KA22CS001)';
  END IF;

  SELECT usn INTO v_existing_usn FROM public.profiles WHERE id = v_uid;
  IF v_existing_usn IS NOT NULL AND pg_catalog.btrim(v_existing_usn) <> '' AND pg_catalog.upper(pg_catalog.btrim(v_existing_usn)) <> v_clean_usn THEN
    RAISE EXCEPTION 'CANNOT_CHANGE_USN: USN cannot be modified after registration';
  END IF;

  INSERT INTO public.profiles (
    id, full_name, usn, department, year, semester, updated_at
  )
  VALUES (
    v_uid, v_clean_name, v_clean_usn, pg_catalog.btrim(p_department), pg_catalog.btrim(p_year), pg_catalog.btrim(p_semester), pg_catalog.now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    usn        = EXCLUDED.usn,
    department = EXCLUDED.department,
    year       = EXCLUDED.year,
    semester   = EXCLUDED.semester,
    updated_at = pg_catalog.now()
  RETURNING * INTO v_profile_record;

  INSERT INTO public.consents (
    student_id, notice_version, purpose, accepted_at, withdrawn_at, superseded_at
  )
  VALUES (
    v_uid, v_canonical_ver, v_canonical_purp, pg_catalog.now(), NULL, NULL
  )
  ON CONFLICT (student_id, notice_version)
    WHERE withdrawn_at IS NULL AND superseded_at IS NULL
    DO NOTHING;

  RETURN pg_catalog.jsonb_build_object(
    'id', v_profile_record.id,
    'full_name', v_profile_record.full_name,
    'usn', v_profile_record.usn,
    'department', v_profile_record.department,
    'year', v_profile_record.year,
    'semester', v_profile_record.semester,
    'created_at', v_profile_record.created_at,
    'updated_at', v_profile_record.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_student_onboarding(text, text, text, text, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding(text, text, text, text, text, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_consent_idempotent(
  p_student_id uuid,
  p_version text DEFAULT 'v1.0-2026'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid;
  v_canonical_version text := 'v1.0-2026';
  v_canonical_purpose text := 'Student event registration, attendance verification, and club records under Kishkinda University policy.';
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Caller must be signed in';
  END IF;

  IF v_caller <> p_student_id THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Cannot record consent for another user';
  END IF;

  IF p_version IS NULL OR pg_catalog.btrim(p_version) <> v_canonical_version THEN
    RAISE EXCEPTION 'INVALID_VERSION: Expected %', v_canonical_version;
  END IF;

  INSERT INTO public.consents (student_id, notice_version, purpose, accepted_at, withdrawn_at, superseded_at)
  VALUES (p_student_id, v_canonical_version, v_canonical_purpose, pg_catalog.now(), NULL, NULL)
  ON CONFLICT (student_id, notice_version)
    WHERE withdrawn_at IS NULL AND superseded_at IS NULL
    DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.record_consent_idempotent(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_consent_idempotent(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.withdraw_consent_atomic(
  p_version text DEFAULT 'v1.0-2026'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Caller must be signed in to withdraw consent';
  END IF;

  UPDATE public.consents
  SET withdrawn_at = pg_catalog.now()
  WHERE student_id = v_uid
    AND notice_version = p_version
    AND withdrawn_at IS NULL
    AND superseded_at IS NULL;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_consent_atomic(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.withdraw_consent_atomic(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_student_atomic(
  p_event_id uuid,
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid;
  v_event record;
  v_count integer;
  v_conf_id text;
  v_year_str text;
  v_seq integer;
  v_existing record;
  v_new_id uuid;
  v_target_status text := 'registered';
  v_waitlist_pos integer := 0;
  v_is_admin boolean := false;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'message', 'You must be signed in to register');
  END IF;

  v_is_admin := public.is_admin(v_caller_id);

  IF v_caller_id IS DISTINCT FROM p_student_id AND NOT v_is_admin THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_student_id) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PROFILE_NOT_FOUND', 'message', 'Student profile does not exist. Please complete onboarding first.');
  END IF;

  IF NOT v_is_admin AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_student_id AND email_confirmed_at IS NOT NULL) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'EMAIL_NOT_VERIFIED', 'message', 'Please verify your email before registering for events');
  END IF;

  IF NOT v_is_admin AND NOT public.is_profile_complete(p_student_id) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PROFILE_INCOMPLETE', 'message', 'You must complete your student profile before registering for events');
  END IF;

  IF NOT v_is_admin AND NOT public.has_active_consent(p_student_id, 'v1.0-2026') THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'CONSENT_REQUIRED', 'message', 'You must accept the Privacy Notice before registering for events');
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  IF NOT FOUND OR v_event.status != 'published' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'EVENT_NOT_AVAILABLE', 'message', 'Event is not available for registration');
  END IF;

  IF pg_catalog.now() > v_event.registration_deadline THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'EVENT_CLOSED', 'message', 'Registration for this event has closed');
  END IF;

  IF v_event.registration_opens_at IS NOT NULL AND pg_catalog.now() < v_event.registration_opens_at THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_YET_OPEN', 'message', 'Registration is not yet open');
  END IF;

  SELECT * INTO v_existing FROM public.registrations WHERE event_id = p_event_id AND student_id = p_student_id;
  IF FOUND THEN
    IF v_existing.status = 'registered' THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'ALREADY_REGISTERED', 'status', 'registered', 'message', 'You are already registered for this event', 'confirmation_id', v_existing.confirmation_id);
    ELSIF v_existing.status = 'waitlisted' THEN
      SELECT count(*) INTO v_waitlist_pos FROM public.registrations WHERE event_id = p_event_id AND status = 'waitlisted' AND created_at <= v_existing.created_at;
      RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'ALREADY_WAITLISTED', 'status', 'waitlisted', 'message', 'You are currently on the waitlist for this event', 'confirmation_id', v_existing.confirmation_id, 'waitlist_position', v_waitlist_pos);
    ELSIF v_existing.status = 'cancelled' THEN
      IF v_event.capacity IS NOT NULL THEN
        SELECT count(*) INTO v_count FROM public.registrations WHERE event_id = p_event_id AND status = 'registered';
        IF v_count >= v_event.capacity THEN
          IF COALESCE(v_event.allow_waitlist, false) IS TRUE THEN
            v_target_status := 'waitlisted';
          ELSE
            RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'CAPACITY_REACHED', 'message', 'This event has reached full capacity');
          END IF;
        END IF;
      END IF;

      UPDATE public.registrations
      SET status = v_target_status, updated_at = pg_catalog.now(), created_at = pg_catalog.now(), registered_by = v_caller_id
      WHERE id = v_existing.id;

      RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'RE_REGISTERED', 'status', v_target_status, 'confirmation_id', v_existing.confirmation_id, 'registered_by', v_caller_id, 'is_admin_registration', (v_caller_id IS DISTINCT FROM p_student_id));
    END IF;
  END IF;

  IF v_event.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.registrations WHERE event_id = p_event_id AND status = 'registered';
    IF v_count >= v_event.capacity THEN
      IF COALESCE(v_event.allow_waitlist, false) IS TRUE THEN
        v_target_status := 'waitlisted';
      ELSE
        RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'CAPACITY_REACHED', 'message', 'This event has reached full capacity');
      END IF;
    END IF;
  END IF;

  v_year_str := pg_catalog.to_char(pg_catalog.now(), 'YY');
  v_seq := pg_catalog.nextval('public.registration_seq'::regclass);
  v_conf_id := 'KU-CC-' || v_year_str || '-' || pg_catalog.lpad(v_seq::text, 4, '0');

  INSERT INTO public.registrations (event_id, student_id, confirmation_id, status, registered_by)
  VALUES (p_event_id, p_student_id, v_conf_id, v_target_status, v_caller_id)
  RETURNING id INTO v_new_id;

  IF v_target_status = 'waitlisted' THEN
    SELECT count(*) INTO v_waitlist_pos FROM public.registrations WHERE event_id = p_event_id AND status = 'waitlisted' AND created_at <= pg_catalog.now();
    RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'WAITLISTED', 'status', 'waitlisted', 'message', 'Event capacity is full. You have been placed on the waitlist.', 'confirmation_id', v_conf_id, 'waitlist_position', v_waitlist_pos, 'registered_by', v_caller_id, 'is_admin_registration', (v_caller_id IS DISTINCT FROM p_student_id));
  END IF;

  RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'REGISTERED', 'status', 'registered', 'message', 'Successfully registered for event', 'confirmation_id', v_conf_id, 'registered_by', v_caller_id, 'is_admin_registration', (v_caller_id IS DISTINCT FROM p_student_id));
END;
$$;

REVOKE ALL ON FUNCTION public.register_student_atomic(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_student_atomic(uuid, uuid) TO authenticated;

create or replace function public.cancel_registration(p_registration_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg record;
  v_event record;
  v_promoted record;
begin
  select * into v_reg
  from public.registrations
  where id = p_registration_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Registration record not found');
  end if;

  if auth.uid() is distinct from v_reg.student_id and not public.is_admin(auth.uid()) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  end if;

  if v_reg.status = 'cancelled' then
    return pg_catalog.jsonb_build_object('success', true, 'code', 'ALREADY_CANCELLED', 'message', 'Registration is already cancelled');
  end if;

  select * into v_event
  from public.events
  where id = v_reg.event_id
  for update;

  if pg_catalog.now() > v_event.starts_at and not public.is_admin(auth.uid()) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'CUTOFF_PASSED', 'message', 'Cancellation cutoff has passed. Events cannot be cancelled after start time.');
  end if;

  update public.registrations
  set status = 'cancelled'
  where id = v_reg.id;

  if v_reg.status = 'registered' then
    select * into v_promoted
    from public.registrations
    where event_id = v_reg.event_id
      and status = 'waitlisted'
    order by created_at asc
    limit 1
    for update;

    if found then
      update public.registrations
      set status = 'registered'
      where id = v_promoted.id;

      return pg_catalog.jsonb_build_object(
        'success', true,
        'code', 'CANCELLED_WITH_PROMOTION',
        'message', 'Registration cancelled successfully and next waitlisted student was promoted',
        'promoted_student_id', v_promoted.student_id
      );
    end if;
  end if;

  return pg_catalog.jsonb_build_object('success', true, 'code', 'CANCELLED', 'message', 'Registration cancelled successfully');
end;
$$;

revoke all on function public.cancel_registration(uuid) from public, anon;
grant execute on function public.cancel_registration(uuid) to authenticated;

create or replace function public.cancel_registration_atomic(
  p_event_id uuid,
  p_student_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg record;
begin
  select * into v_reg
  from public.registrations
  where event_id = p_event_id and student_id = p_student_id;

  if not found then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Registration record not found');
  end if;

  return public.cancel_registration(v_reg.id);
end;
$$;

revoke all on function public.cancel_registration_atomic(uuid, uuid) from public, anon;
grant execute on function public.cancel_registration_atomic(uuid, uuid) to authenticated;

create or replace view public.events_public as
select
  e.id,
  e.slug,
  e.title,
  e.type,
  e.short_description,
  e.description,
  e.agenda,
  e.prerequisites,
  e.venue,
  e.starts_at,
  e.ends_at,
  e.eligibility,
  e.coordinator_name,
  e.registration_opens_at,
  e.registration_deadline,
  e.capacity,
  e.status,
  e.created_at,
  coalesce(count(r.id) filter (where r.status = 'registered'), 0)::integer as registrations_count,
  case
    when e.capacity is null then null
    else greatest(0, e.capacity - coalesce(count(r.id) filter (where r.status = 'registered'), 0)::integer)
  end as seats_left,
  coalesce(count(r.id) filter (where r.status = 'waitlisted'), 0)::integer as waitlist_count
from public.events e
left join public.registrations r on r.event_id = e.id
where e.status = 'published'
group by e.id;

grant select on public.events_public to anon, authenticated;

create or replace function public.get_public_events()
returns setof public.events_public
language sql
security definer
stable
set search_path = ''
as $$
  select * from public.events_public order by starts_at asc;
$$;

revoke all on function public.get_public_events() from public;
grant execute on function public.get_public_events() to anon, authenticated;

create or replace function public.check_in_attendee(
  p_event_id uuid,
  p_query text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg record;
  v_clean text;
begin
  if not public.is_admin(auth.uid()) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized: Admin role required.');
  end if;

  v_clean := pg_catalog.upper(pg_catalog.btrim(p_query));
  if v_clean = '' then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'INVALID_QUERY', 'message', 'Confirmation ID or USN is required.');
  end if;

  select r.*, p.full_name, p.usn, p.department, p.year, e.title as event_title
  into v_reg
  from public.registrations r
  join public.profiles p on p.id = r.student_id
  join public.events e on e.id = r.event_id
  where r.event_id = p_event_id
    and (pg_catalog.upper(r.confirmation_id) = v_clean or pg_catalog.upper(p.usn) = v_clean);

  if not found then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'No registration found for this event with provided Confirmation ID or USN.');
  end if;

  if v_reg.status = 'cancelled' then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'REGISTRATION_CANCELLED', 'message', 'This registration was cancelled and is invalid for entry.');
  end if;

  if v_reg.status = 'waitlisted' then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'STILL_WAITLISTED', 'message', 'This attendee is on the waitlist and has not been confirmed for admission.');
  end if;

  if v_reg.checked_in_at is not null then
    return pg_catalog.jsonb_build_object(
      'success', true,
      'code', 'ALREADY_CHECKED_IN',
      'already_checked_in', true,
      'message', pg_catalog.format('Already checked in at %s', pg_catalog.to_char(v_reg.checked_in_at at time zone 'Asia/Kolkata', 'HH12:MI AM IST')),
      'checked_in_at', v_reg.checked_in_at,
      'attendee', pg_catalog.jsonb_build_object(
        'name', v_reg.full_name,
        'usn', v_reg.usn,
        'department', v_reg.department,
        'year', v_reg.year,
        'confirmation_id', v_reg.confirmation_id,
        'event_title', v_reg.event_title
      )
    );
  end if;

  update public.registrations
  set checked_in_at = pg_catalog.now()
  where id = v_reg.id;

  return pg_catalog.jsonb_build_object(
    'success', true,
    'code', 'CHECKED_IN',
    'already_checked_in', false,
    'message', 'Check-in verified successfully.',
    'checked_in_at', pg_catalog.now(),
    'attendee', pg_catalog.jsonb_build_object(
      'name', v_reg.full_name,
      'usn', v_reg.usn,
      'department', v_reg.department,
      'year', v_reg.year,
      'confirmation_id', v_reg.confirmation_id,
      'event_title', v_reg.event_title
    )
  );
end;
$$;

revoke all on function public.check_in_attendee(uuid, text) from public, anon;
grant execute on function public.check_in_attendee(uuid, text) to authenticated;

create or replace function public.delete_student_account(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is distinct from p_student_id and not public.is_admin(auth.uid()) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  end if;

  delete from public.consents where student_id = p_student_id;
  delete from public.registrations where student_id = p_student_id;
  delete from public.profiles where id = p_student_id;
  delete from auth.users where id = p_student_id;

  return pg_catalog.jsonb_build_object('success', true, 'code', 'DELETED', 'message', 'Account deleted successfully');
end;
$$;

revoke all on function public.delete_student_account(uuid) from public, anon;
grant execute on function public.delete_student_account(uuid) to authenticated;

create or replace function public.admin_delete_student(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usn text;
  v_name text;
begin
  if not public.is_admin(auth.uid()) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized: Admin role required.');
  end if;

  select usn, full_name into v_usn, v_name from public.profiles where id = p_student_id;

  delete from public.consents where student_id = p_student_id;
  delete from public.registrations where student_id = p_student_id;
  delete from public.profiles where id = p_student_id;
  delete from auth.users where id = p_student_id;

  insert into public.export_log (admin_id, filters, row_count, created_at)
  values (
    auth.uid(),
    pg_catalog.jsonb_build_object('action', 'ADMIN_DELETE_STUDENT', 'target_student_id', p_student_id, 'usn', v_usn, 'name', v_name),
    1,
    pg_catalog.now()
  );

  return pg_catalog.jsonb_build_object('success', true, 'code', 'DELETED', 'message', 'Student account and records deleted successfully.');
end;
$$;

revoke all on function public.admin_delete_student(uuid) from public, anon;
grant execute on function public.admin_delete_student(uuid) to authenticated;

create or replace function public.log_export(
  p_filters jsonb,
  p_row_count integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin(auth.uid()) then
    return pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized: Admin role required.');
  end if;

  insert into public.export_log (admin_id, filters, row_count, created_at)
  values (auth.uid(), COALESCE(p_filters, '{}'::jsonb), COALESCE(p_row_count, 0), pg_catalog.now());

  return pg_catalog.jsonb_build_object('success', true);
end;
$$;

revoke all on function public.log_export(jsonb, integer) from public, anon;
grant execute on function public.log_export(jsonb, integer) to authenticated;

revoke all on function public.log_export(jsonb, integer) from public;
grant execute on function public.log_export(jsonb, integer) to authenticated;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'gallery',
      'gallery',
      true,
      5242880,
      array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    )
    on conflict (id) do update set
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

    drop policy if exists "Public gallery read" on storage.objects;
    create policy "Public gallery read"
      on storage.objects
      for select
      to public
      using (bucket_id = 'gallery');

    drop policy if exists "Admin gallery insert" on storage.objects;
    create policy "Admin gallery insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'gallery' and public.is_admin(auth.uid()));

    drop policy if exists "Admin gallery update" on storage.objects;
    create policy "Admin gallery update"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'gallery' and public.is_admin(auth.uid()))
      with check (bucket_id = 'gallery' and public.is_admin(auth.uid()));

    drop policy if exists "Admin gallery delete" on storage.objects;
    create policy "Admin gallery delete"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'gallery' and public.is_admin(auth.uid()));
  end if;
end $$;

alter table public.events enable row level security;
alter table public.profiles enable row level security;
alter table public.registrations enable row level security;
alter table public.consents enable row level security;
alter table public.admin_roles enable row level security;
alter table public.export_log enable row level security;
alter table public.announcements enable row level security;
alter table public.projects enable row level security;
alter table public.gallery_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.contact_rate_limit enable row level security;

drop policy if exists "Public can view published events" on public.events;
create policy "Public can view published events"
  on public.events
  for select
  to public
  using (status = 'published');

drop policy if exists "Admins have full access to events" on public.events;
create policy "Admins have full access to events"
  on public.events
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

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
  using (public.is_admin(auth.uid()));

drop policy if exists "Students read own registrations" on public.registrations;
create policy "Students read own registrations"
  on public.registrations
  for select
  to authenticated
  using (student_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Students insert own registrations" on public.registrations;
drop policy if exists "Students update own registrations" on public.registrations;
drop policy if exists "Admins have full access to registrations" on public.registrations;

create policy "Admins have full access to registrations"
  on public.registrations
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

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
drop policy if exists "Admins select export_log" on public.export_log;
create policy "Admins select export_log"
  on public.export_log
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

drop policy if exists "Public can view published announcements" on public.announcements;
create policy "Public can view published announcements"
  on public.announcements
  for select
  to public
  using (status = 'published');

drop policy if exists "Admins have full access to announcements" on public.announcements;
create policy "Admins have full access to announcements"
  on public.announcements
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Public can view projects" on public.projects;
create policy "Public can view projects"
  on public.projects
  for select
  to public
  using (published = true);

drop policy if exists "Admins have full access to projects" on public.projects;
create policy "Admins have full access to projects"
  on public.projects
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Public can view published gallery items" on public.gallery_items;
create policy "Public can view published gallery items"
  on public.gallery_items
  for select
  to public
  using (published = true);

drop policy if exists "Admins have full access to gallery items" on public.gallery_items;
create policy "Admins have full access to gallery items"
  on public.gallery_items
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Anyone can submit contact message" on public.contact_messages;
create policy "Anyone can submit contact message"
  on public.contact_messages
  for insert
  to public
  with check (
    length(trim(name)) between 1 and 100
    and length(trim(email)) between 5 and 100
    and length(trim(message)) between 5 and 2000
  );

drop policy if exists "Admins have full access to contact messages" on public.contact_messages;
create policy "Admins have full access to contact messages"
  on public.contact_messages
  for all
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_starts on public.events(starts_at);
create index if not exists idx_profiles_usn on public.profiles(lower(usn));
create index if not exists idx_profiles_dept on public.profiles(department);
create index if not exists idx_profiles_year on public.profiles(year);
create index if not exists idx_profiles_sem on public.profiles(semester);
create index if not exists idx_registrations_event on public.registrations(event_id);
create index if not exists idx_registrations_student on public.registrations(student_id);
create index if not exists idx_registrations_conf on public.registrations(confirmation_id);
create index if not exists idx_registrations_status on public.registrations(status);
create index if not exists idx_registrations_created on public.registrations(created_at);
create index if not exists idx_consents_student on public.consents(student_id);
create index if not exists idx_admin_roles_user on public.admin_roles(user_id);
create index if not exists idx_export_log_admin on public.export_log(admin_id);
create index if not exists idx_export_log_created on public.export_log(created_at desc);
create index if not exists idx_contact_handled on public.contact_messages(handled);
create index if not exists idx_contact_created on public.contact_messages(created_at desc);
create index if not exists idx_contact_rate on public.contact_rate_limit(sender_email, created_at desc);
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_published on public.projects(published);
create index if not exists idx_gallery_event on public.gallery_items(event_id);
create index if not exists idx_gallery_published on public.gallery_items(published);

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

-- ============================================================================
-- 10. Feedback System
-- ============================================================================
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

create table if not exists public._backfill_quarantined_accounts (
  quarantine_id uuid primary key default gen_random_uuid(),
  detected_at timestamptz not null default now(),
  reason text not null,
  user_id uuid not null,
  email text,
  full_name text,
  usn text,
  department text,
  year text,
  semester text
);

alter table public._backfill_quarantined_accounts enable row level security;
revoke all on public._backfill_quarantined_accounts from public, anon, authenticated;
grant all on public._backfill_quarantined_accounts to service_role;


