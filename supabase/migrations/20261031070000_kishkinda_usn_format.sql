-- Migration 12: 20261031070000_kishkinda_usn_format.sql
-- Description: Align public.profiles and complete_student_onboarding USN format to Kishkinda University pattern (^KU[A-Z]?(?:[0-9]{2}|[0-9]{4})[A-Z]{2,4}[0-9]{3}$) and remove VTU references.

-- 1. Update check constraint on public.profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS chk_profiles_usn_format;

ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_usn_format
  CHECK (usn ~ '^KU[A-Z]?(?:[0-9]{2}|[0-9]{4})[A-Z]{2,4}[0-9]{3}$');

-- 2. Update complete_student_onboarding function
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

  -- 4. Sanitize and validate basic inputs
  v_clean_name := pg_catalog.btrim(COALESCE(p_full_name, ''));
  v_clean_usn  := pg_catalog.upper(pg_catalog.btrim(COALESCE(p_usn, '')));

  IF pg_catalog.length(v_clean_name) < 2 OR pg_catalog.length(v_clean_name) > 100 THEN
    RAISE EXCEPTION 'INVALID_NAME: Full name must be between 2 and 100 characters';
  END IF;

  IF v_clean_usn !~ '^KU[A-Z]?(?:[0-9]{2}|[0-9]{4})[A-Z]{2,4}[0-9]{3}$' THEN
    RAISE EXCEPTION 'INVALID_USN: USN must follow Kishkinda University format (e.g. KUB24CSE198)';
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

