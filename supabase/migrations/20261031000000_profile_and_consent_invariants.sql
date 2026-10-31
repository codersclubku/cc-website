-- =============================================================================
-- Migration: 20261031000000_profile_and_consent_invariants.sql
-- Description:
--   1. Consent non-destructive deduplication via superseded_at / superseded_by.
--   2. Partial unique index on active consents (withdrawn_at IS NULL AND superseded_at IS NULL).
--   3. Academic check constraints on public.profiles matching src/lib/validation.ts.
--   4. Helper functions has_active_consent() and is_profile_complete().
--   5. Atomic complete_student_onboarding() RPC enforcing explicit consent,
--      canonical academic validation, and USN immutability.
--   6. Enforce consent and profile completeness in register_student_atomic()
--      and RLS policies on public.registrations.
--   7. Secure collision-quarantined backfill procedure.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1: Consents Schema Enhancement (Preserving Historical Records)
-- ---------------------------------------------------------------------------

ALTER TABLE public.consents
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz,
  ADD COLUMN IF NOT EXISTS superseded_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'consents_superseded_by_fkey'
      AND table_name = 'consents'
  ) THEN
    ALTER TABLE public.consents
      ADD CONSTRAINT consents_superseded_by_fkey
      FOREIGN KEY (superseded_by) REFERENCES public.consents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Safely supersede older duplicate active consent records without modifying
-- withdrawn_at (preserving genuine withdrawal semantics) and without mutating purpose.
DO $$
BEGIN
  UPDATE public.consents old_c
  SET
    superseded_at = now(),
    superseded_by = new_c.id
  FROM (
    SELECT DISTINCT ON (student_id, notice_version)
      id, student_id, notice_version
    FROM public.consents
    WHERE withdrawn_at IS NULL AND superseded_at IS NULL
    ORDER BY student_id, notice_version, accepted_at DESC, id DESC
  ) new_c
  WHERE old_c.student_id = new_c.student_id
    AND old_c.notice_version = new_c.notice_version
    AND old_c.withdrawn_at IS NULL
    AND old_c.superseded_at IS NULL
    AND old_c.id <> new_c.id;
END $$;

-- Establish partial unique index: exactly one active consent per student and notice version
CREATE UNIQUE INDEX IF NOT EXISTS idx_consents_student_version_active
  ON public.consents (student_id, notice_version)
  WHERE withdrawn_at IS NULL AND superseded_at IS NULL;

-- Harden client RLS on consents: revoke direct client INSERT, UPDATE, and DELETE.
-- All consent creation, updates, and withdrawals must proceed via authoritative RPCs.
DROP POLICY IF EXISTS "Students insert own consents" ON public.consents;
DROP POLICY IF EXISTS "Students update own consents" ON public.consents;
REVOKE INSERT, UPDATE, DELETE ON public.consents FROM authenticated, anon;
GRANT SELECT ON public.consents TO authenticated;

-- ---------------------------------------------------------------------------
-- PART 2: Canonical Academic Check Constraints on public.profiles
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_profiles_department,
  DROP CONSTRAINT IF EXISTS chk_profiles_year,
  DROP CONSTRAINT IF EXISTS chk_profiles_semester,
  DROP CONSTRAINT IF EXISTS chk_profiles_usn_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_department CHECK (
    department IN (
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
  ADD CONSTRAINT chk_profiles_year CHECK (
    year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')
  ),
  ADD CONSTRAINT chk_profiles_semester CHECK (
    semester IN (
      '1st Semester', '2nd Semester', '3rd Semester', '4th Semester',
      '5th Semester', '6th Semester', '7th Semester', '8th Semester'
    )
  ),
  ADD CONSTRAINT chk_profiles_usn_format CHECK (
    usn ~ '^(KU[0-9]{4}[A-Z]{2,4}[0-9]{3}|[1-9][A-Z]{2}[0-9]{2}[A-Z]{2,4}[0-9]{3})$'
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_usn_unique_case_insensitive
  ON public.profiles (lower(trim(usn)));

-- ---------------------------------------------------------------------------
-- PART 3: Authorization Helper Functions
-- ---------------------------------------------------------------------------

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

  -- Allow the student themselves or an administrator to check consent status
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

  -- Allow the student themselves or an administrator to check profile completeness
  IF v_caller IS DISTINCT FROM p_student_id AND NOT public.is_admin(v_caller) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Cannot inspect profile completeness of another student';
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_student_id
      AND full_name IS NOT NULL AND pg_catalog.trim(full_name) <> ''
      AND usn IS NOT NULL AND pg_catalog.trim(usn) <> ''
      AND department IS NOT NULL AND pg_catalog.trim(department) <> ''
      AND year IS NOT NULL AND pg_catalog.trim(year) <> ''
      AND semester IS NOT NULL AND pg_catalog.trim(semester) <> ''
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_active_consent(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_active_consent(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_profile_complete(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_profile_complete(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- PART 4: Atomic complete_student_onboarding() RPC
-- ---------------------------------------------------------------------------

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
    RAISE EXCEPTION 'INVALID_VERSION: Notice version % is invalid. Expected %', pg_catalog.coalesce(p_version, 'NULL'), v_canonical_ver;
  END IF;

  -- 4. Sanitize and validate basic inputs
  v_clean_name := pg_catalog.trim(pg_catalog.coalesce(p_full_name, ''));
  v_clean_usn  := pg_catalog.upper(pg_catalog.trim(pg_catalog.coalesce(p_usn, '')));

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

-- ---------------------------------------------------------------------------
-- PART 5: Explicit Standalone Consent Recording RPC
-- ---------------------------------------------------------------------------

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

  IF p_version IS NULL OR pg_catalog.trim(p_version) <> v_canonical_version THEN
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

-- Authoritative Standalone Consent Withdrawal RPC
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

-- ---------------------------------------------------------------------------
-- PART 6: Authoritative Enforcement in register_student_atomic()
-- ---------------------------------------------------------------------------

-- Ensure prerequisite columns exist on public.events and public.registrations.
-- Default allow_waitlist is FALSE to preserve existing event behavior without silently enabling waitlists.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS allow_waitlist boolean NOT NULL DEFAULT false;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS registered_by uuid REFERENCES auth.users(id);

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
  -- 1. Caller authentication and authorization
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_AUTHENTICATED', 'message', 'You must be signed in to register');
  END IF;

  v_is_admin := public.is_admin(v_caller_id);

  -- Only self-registration or authorized administrators permitted
  IF v_caller_id IS DISTINCT FROM p_student_id AND NOT v_is_admin THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  END IF;

  -- 2. Target profile existence check (foreign key integrity)
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_student_id) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PROFILE_NOT_FOUND', 'message', 'Student profile does not exist. Please complete onboarding first.');
  END IF;

  -- 3. Email verification check (enforced for students; administrators exempt for desk registrations)
  IF NOT v_is_admin AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_student_id AND email_confirmed_at IS NOT NULL) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'EMAIL_NOT_VERIFIED', 'message', 'Please verify your email before registering for events');
  END IF;

  -- 4. Student Profile Completeness (non-admin callers)
  IF NOT v_is_admin AND NOT public.is_profile_complete(p_student_id) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'PROFILE_INCOMPLETE', 'message', 'You must complete your student profile before registering for events');
  END IF;

  -- 5. Active Privacy Consent (non-admin callers)
  IF NOT v_is_admin AND NOT public.has_active_consent(p_student_id, 'v1.0-2026') THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'CONSENT_REQUIRED', 'message', 'You must accept the Privacy Notice before registering for events');
  END IF;

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
          IF pg_catalog.coalesce(v_event.allow_waitlist, false) IS TRUE THEN
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
      IF pg_catalog.coalesce(v_event.allow_waitlist, false) IS TRUE THEN
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
GRANT EXECUTE ON FUNCTION public.register_student_atomic(uuid, uuid) TO authenticated;

-- Ensure is_admin() signature, identity checks, and permissions are authoritative
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

  v_target := pg_catalog.coalesce(check_user_id, v_caller);

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
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

-- Ensure has_role() identity checks and permissions are authoritative
CREATE OR REPLACE FUNCTION public.has_role(target_user_id uuid, required_role text)
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
    RETURN false;
  END IF;

  IF v_caller IS DISTINCT FROM target_user_id THEN
    IF NOT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = v_caller) THEN
      RAISE EXCEPTION 'UNAUTHORIZED: Cannot inspect role of another user';
    END IF;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = target_user_id
      AND role = required_role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- PART 7: Authoritative RLS Policy on public.registrations
-- ---------------------------------------------------------------------------

-- Revoke direct student inserts on registrations. All student event registrations
-- MUST proceed via register_student_atomic() to ensure capacity locking,
-- duplicate suppression, sequential confirmation generation, and invariant checks.
DROP POLICY IF EXISTS "Students insert own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Admins insert registrations" ON public.registrations;
CREATE POLICY "Admins insert registrations"
  ON public.registrations FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- PART 8: Collision-Quarantined Backfill (Run manually if required)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public._backfill_quarantined_accounts (
  quarantine_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL,
  user_id uuid NOT NULL,
  email text,
  full_name text,
  usn text,
  department text,
  year text,
  semester text
);

ALTER TABLE public._backfill_quarantined_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._backfill_quarantined_accounts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public._backfill_quarantined_accounts TO service_role;

