-- =============================================================================
-- Migration: 20261031060000_fix_trim_in_hardened_functions.sql
-- Description:
--   Corrects invalid pg_catalog.trim(...) references by replacing them with
--   pg_catalog.btrim(...). In PostgreSQL, standard SQL TRIM() is an unadorned
--   syntactic construct mapped internally to pg_catalog.btrim(); pg_catalog.trim
--   does not exist as an ordinary catalog function and raises SQLSTATE 42883.
--
-- Functions corrected:
--   1. public.guard_profile_updates()
--   2. public.process_contact_message()
--   3. public.is_profile_complete(uuid)
--   4. public.record_consent_idempotent(uuid, text)
--   5. public.check_in_attendee(uuid, text)
--   6. public.complete_student_onboarding(...)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Correct public.guard_profile_updates()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    IF NEW.id <> OLD.id THEN
      RAISE EXCEPTION 'CANNOT_CHANGE_ID: Profile ID cannot be modified';
    END IF;
    IF NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'CANNOT_CHANGE_CREATED_AT: Creation timestamp cannot be modified';
    END IF;
    IF OLD.usn IS NOT NULL AND OLD.usn <> '' AND pg_catalog.upper(pg_catalog.btrim(NEW.usn)) <> pg_catalog.upper(pg_catalog.btrim(OLD.usn)) THEN
      RAISE EXCEPTION 'CANNOT_CHANGE_USN: USN cannot be modified after registration';
    END IF;
  END IF;
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_updates() FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Correct public.process_contact_message()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.process_contact_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_recent_count integer;
  v_clean_email text;
  v_clean_name text;
  v_clean_msg text;
BEGIN
  v_clean_name := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.name), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g');
  v_clean_email := pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.btrim(NEW.email), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g'));
  v_clean_msg := pg_catalog.regexp_replace(pg_catalog.btrim(NEW.message), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g');

  IF pg_catalog.length(v_clean_name) < 1 OR pg_catalog.length(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME: Name must be between 1 and 100 characters';
  END IF;

  IF v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR pg_catalog.length(v_clean_email) > 100 THEN
    RAISE EXCEPTION 'INVALID_EMAIL: Please provide a valid email address';
  END IF;

  IF pg_catalog.length(v_clean_msg) < 5 OR pg_catalog.length(v_clean_msg) > 2000 THEN
    RAISE EXCEPTION 'INVALID_MESSAGE: Message must be between 5 and 2000 characters';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.contact_rate_limit
  WHERE sender_email = v_clean_email
    AND created_at > (pg_catalog.now() - interval '1 hour');

  IF v_recent_count >= 3 THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: Too many messages sent. Please wait an hour before submitting again.';
  END IF;

  INSERT INTO public.contact_rate_limit (sender_email, created_at)
  VALUES (v_clean_email, pg_catalog.now());

  NEW.name := v_clean_name;
  NEW.email := v_clean_email;
  NEW.message := v_clean_msg;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.process_contact_message() FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Correct public.is_profile_complete(uuid)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_profile_complete(p_student_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Caller must be signed in';
  END IF;

  -- Allow the student themselves or an administrator to check profile completeness
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
GRANT EXECUTE ON FUNCTION public.is_profile_complete(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Correct public.record_consent_idempotent(uuid, text)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_consent_idempotent(
  p_student_id uuid,
  p_version text DEFAULT 'v1.0-2026'::text
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
GRANT EXECUTE ON FUNCTION public.record_consent_idempotent(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Correct public.check_in_attendee(uuid, text)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_in_attendee(p_event_id uuid, p_query text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reg record;
  v_clean text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized: Admin role required.');
  END IF;

  v_clean := pg_catalog.upper(pg_catalog.btrim(p_query));
  IF v_clean = '' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'INVALID_QUERY', 'message', 'Confirmation ID or USN is required.');
  END IF;

  SELECT r.*, p.full_name, p.usn, p.department, p.year, e.title as event_title
  INTO v_reg
  FROM public.registrations r
  JOIN public.profiles p ON p.id = r.student_id
  JOIN public.events e ON e.id = r.event_id
  WHERE r.event_id = p_event_id
    AND (pg_catalog.upper(r.confirmation_id) = v_clean OR pg_catalog.upper(p.usn) = v_clean);

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'No registration found for this event with provided Confirmation ID or USN.');
  END IF;

  IF v_reg.status = 'cancelled' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'REGISTRATION_CANCELLED', 'message', 'This registration was cancelled and is invalid for entry.');
  END IF;

  IF v_reg.status = 'waitlisted' THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'STILL_WAITLISTED', 'message', 'This attendee is on the waitlist and has not been confirmed for admission.');
  END IF;

  IF v_reg.checked_in_at IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
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
  END IF;

  UPDATE public.registrations
  SET checked_in_at = pg_catalog.now()
  WHERE id = v_reg.id;

  RETURN pg_catalog.jsonb_build_object(
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
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_attendee(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_in_attendee(uuid, text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Correct public.complete_student_onboarding(...)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.complete_student_onboarding(
  p_full_name text,
  p_usn text,
  p_department text,
  p_year text,
  p_semester text,
  p_consent boolean,
  p_version text DEFAULT 'v1.0-2026'::text
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
  -- 1. Enforce authentication
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED: Caller must be signed in to complete onboarding';
  END IF;

  -- 2. Enforce explicit affirmative consent
  IF p_consent IS NOT TRUE THEN
    RAISE EXCEPTION 'CONSENT_REQUIRED: Explicit privacy notice acceptance is required to register a student profile';
  END IF;

  -- 3. Validate notice version
  IF p_version IS NULL OR pg_catalog.btrim(p_version) <> v_canonical_ver THEN
    RAISE EXCEPTION 'INVALID_VERSION: Notice version % is invalid. Expected %', COALESCE(p_version, 'NULL'), v_canonical_ver;
  END IF;

  -- 4. Sanitize and validate basic inputs (preserving Migration 10 COALESCE fix)
  v_clean_name := pg_catalog.btrim(COALESCE(p_full_name, ''));
  v_clean_usn  := pg_catalog.upper(pg_catalog.btrim(COALESCE(p_usn, '')));

  IF pg_catalog.length(v_clean_name) < 2 OR pg_catalog.length(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME: Full name must be between 2 and 100 characters';
  END IF;

  IF v_clean_usn !~ '^(KU[0-9]{4}[A-Z]{2,4}[0-9]{3}|[1-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3})$' THEN
    RAISE EXCEPTION 'INVALID_USN: USN must follow Kishkinda University format (e.g. KU2024CS001) or Karnataka VTU format (e.g. 2KA22CS001)';
  END IF;

  -- 5. USN Immutability Check: If profile row already exists with an assigned USN, reject changes
  SELECT usn INTO v_existing_usn FROM public.profiles WHERE id = v_uid;
  IF v_existing_usn IS NOT NULL AND pg_catalog.btrim(v_existing_usn) <> '' AND pg_catalog.upper(pg_catalog.btrim(v_existing_usn)) <> v_clean_usn THEN
    RAISE EXCEPTION 'CANNOT_CHANGE_USN: USN cannot be modified after registration';
  END IF;

  -- 6. Upsert profile (Check constraints chk_profiles_* validate dept, year, sem)
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

  -- 7. Persist consent record with authoritative server timestamp
  INSERT INTO public.consents (
    student_id, notice_version, purpose, accepted_at, withdrawn_at, superseded_at
  )
  VALUES (
    v_uid, v_canonical_ver, v_canonical_purp, pg_catalog.now(), NULL, NULL
  )
  ON CONFLICT DO NOTHING;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'profile', pg_catalog.row_to_json(v_profile_record)::jsonb,
    'consented', true,
    'notice_version', v_canonical_ver
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_student_onboarding(text, text, text, text, text, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding(text, text, text, text, text, boolean, text) TO authenticated, service_role;

