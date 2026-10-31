-- =============================================================================
-- Migration: 20261031050000_fix_coalesce_in_hardened_functions.sql
-- Description:
--   Corrects COALESCE expression syntax in five hardened functions where
--   pg_catalog.coalesce(...) was erroneously schema-qualified. In SQL standard
--   and PostgreSQL, COALESCE is a syntactic construct with short-circuit evaluation,
--   not a schema-qualified function in pg_catalog.
--
-- Functions corrected:
--   1. public.is_admin(uuid)
--   2. public.check_registration_capacity()
--   3. public.complete_student_onboarding(...)
--   4. public.register_student_atomic(...)
--   5. public.log_export(...)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Correct public.is_admin(uuid)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_caller uuid;
  v_target uuid;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RETURN false;
  END IF;

  v_target := COALESCE(check_user_id, v_caller);

  -- Self-check is always allowed for authenticated users.
  -- Probing another user ID is only allowed if caller is already an administrator.
  IF v_caller IS DISTINCT FROM v_target THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = v_caller) THEN
      RAISE EXCEPTION 'UNAUTHORIZED: Cannot inspect administrator status of another user';
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = v_target
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Correct public.check_registration_capacity()
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_registration_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event record;
  v_current_count integer;
BEGIN
  SELECT * INTO v_event
  FROM public.events
  WHERE id = NEW.event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND: Event does not exist';
  END IF;

  IF v_event.status != 'published' THEN
    RAISE EXCEPTION 'EVENT_NOT_PUBLISHED: Registration is not open for this event';
  END IF;

  IF pg_catalog.now() > v_event.registration_deadline THEN
    RAISE EXCEPTION 'EVENT_CLOSED: Registration deadline has passed';
  END IF;

  IF v_event.registration_opens_at IS NOT NULL AND pg_catalog.now() < v_event.registration_opens_at THEN
    RAISE EXCEPTION 'EVENT_NOT_YET_OPEN: Registration has not opened yet';
  END IF;

  IF NEW.status = 'registered' AND v_event.capacity IS NOT NULL THEN
    SELECT count(*) INTO v_current_count
    FROM public.registrations
    WHERE event_id = NEW.event_id
      AND status = 'registered'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_current_count >= v_event.capacity THEN
      RAISE EXCEPTION 'EVENT_FULL: This event has reached maximum capacity';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_registration_capacity() FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Correct public.complete_student_onboarding(...)
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
  IF p_version IS NULL OR pg_catalog.trim(p_version) <> v_canonical_ver THEN
    RAISE EXCEPTION 'INVALID_VERSION: Notice version % is invalid. Expected %', COALESCE(p_version, 'NULL'), v_canonical_ver;
  END IF;

  -- 4. Sanitize and validate basic inputs
  v_clean_name := pg_catalog.trim(COALESCE(p_full_name, ''));
  v_clean_usn  := pg_catalog.upper(pg_catalog.trim(COALESCE(p_usn, '')));

  IF pg_catalog.length(v_clean_name) < 2 OR pg_catalog.length(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME: Full name must be between 2 and 100 characters';
  END IF;

  IF v_clean_usn !~ '^(KU[0-9]{4}[A-Z]{2,4}[0-9]{3}|[1-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3})$' THEN
    RAISE EXCEPTION 'INVALID_USN: USN must follow Kishkinda University format (e.g. KU2024CS001) or Karnataka VTU format (e.g. 2KA22CS001)';
  END IF;

  -- 5. USN Immutability Check: If profile row already exists with an assigned USN, reject changes
  SELECT usn INTO v_existing_usn FROM public.profiles WHERE id = v_uid;
  IF v_existing_usn IS NOT NULL AND pg_catalog.trim(v_existing_usn) <> '' AND pg_catalog.upper(pg_catalog.trim(v_existing_usn)) <> v_clean_usn THEN
    RAISE EXCEPTION 'CANNOT_CHANGE_USN: USN cannot be modified after registration';
  END IF;

  -- 6. Upsert profile (Check constraints chk_profiles_* validate dept, year, sem)
  INSERT INTO public.profiles (
    id, full_name, usn, department, year, semester, updated_at
  )
  VALUES (
    v_uid, v_clean_name, v_clean_usn, pg_catalog.trim(p_department), pg_catalog.trim(p_year), pg_catalog.trim(p_semester), pg_catalog.now()
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

-- ---------------------------------------------------------------------------
-- 4. Correct public.register_student_atomic(...)
-- ---------------------------------------------------------------------------

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
  v_is_admin boolean := false;
  v_event record;
  v_existing record;
  v_count integer;
  v_target_status text := 'registered';
  v_year_str text;
  v_seq bigint;
  v_conf_id text;
  v_new_id uuid;
  v_waitlist_pos bigint;
BEGIN
  -- 1. Authentication check
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'message', 'You must be signed in to register');
  END IF;

  -- 2. Authorization check
  IF v_caller_id IS DISTINCT FROM p_student_id THEN
    SELECT EXISTS (
      SELECT 1 FROM public.admin_roles WHERE user_id = v_caller_id
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'message', 'You can only register for yourself');
    END IF;
  END IF;

  -- 3. Invariant: Profile completeness check
  IF NOT public.is_profile_complete(p_student_id) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PROFILE_INCOMPLETE', 'message', 'Student profile must be complete before registering for events');
  END IF;

  -- 4. Invariant: Active consent verification
  IF NOT public.has_active_consent(p_student_id, 'v1.0-2026') THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'CONSENT_REQUIRED', 'message', 'Active privacy consent is required before registering for events');
  END IF;

  -- 5. Lock student row across event registration attempts
  PERFORM 1 FROM public.profiles WHERE id = p_student_id FOR UPDATE;

  -- 6. Event lookup and locking
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

  -- 7. Existing registration check
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

  -- 8. Capacity and waitlist management
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

  -- 9. Generate sequential confirmation identifier
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
GRANT EXECUTE ON FUNCTION public.register_student_atomic(uuid, uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Correct public.log_export(...)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_export(p_filters jsonb, p_row_count integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Only administrators can log exports';
  END IF;

  INSERT INTO public.export_log (admin_id, filters, row_count, created_at)
  VALUES (auth.uid(), COALESCE(p_filters, '{}'::jsonb), COALESCE(p_row_count, 0), pg_catalog.now());

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.log_export(jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_export(jsonb, integer) TO authenticated, service_role;

