-- =============================================================================
-- Migration: 20261031020000_security_definer_and_helper_hardening.sql
-- Description:
--   Forward migration establishing authoritative security hardening across all
--   pre-existing functions for databases where historical migrations (20261021*)
--   have already been applied.
--
-- Invariants enforced:
--   1. SET search_path = '' on all SECURITY DEFINER functions.
--   2. Explicit schema qualification for all tables (public.), system routines
--      (pg_catalog.), and authentication helpers (auth.).
--   3. Explicit revocation of direct client execution on trigger functions
--      (PUBLIC, anon, authenticated).
--   4. Explicit revocation of EXECUTE from anon and PUBLIC on all sensitive RPCs.
--   5. Idempotent re-declaration safe for fresh and existing databases.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- PART 1: Trigger Functions Hardening
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
    IF OLD.usn IS NOT NULL AND OLD.usn <> '' AND pg_catalog.upper(pg_catalog.trim(NEW.usn)) <> pg_catalog.upper(pg_catalog.trim(OLD.usn)) THEN
      RAISE EXCEPTION 'CANNOT_CHANGE_USN: USN cannot be modified after registration';
    END IF;
  END IF;
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_updates() FROM PUBLIC, anon, authenticated;

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
  v_clean_name := pg_catalog.regexp_replace(pg_catalog.trim(NEW.name), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g');
  v_clean_email := pg_catalog.lower(pg_catalog.regexp_replace(pg_catalog.trim(NEW.email), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g'));
  v_clean_msg := pg_catalog.regexp_replace(pg_catalog.trim(NEW.message), '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g');

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

REVOKE ALL ON FUNCTION public.process_contact_message() FROM PUBLIC, anon, authenticated;

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
      AND id != pg_catalog.coalesce(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_current_count >= v_event.capacity THEN
      RAISE EXCEPTION 'EVENT_FULL: This event has reached maximum capacity';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.check_registration_capacity() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART 2: Registration Cancellation RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_registration(p_registration_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reg record;
  v_event record;
  v_promoted record;
BEGIN
  SELECT * INTO v_reg
  FROM public.registrations
  WHERE id = p_registration_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Registration record not found');
  END IF;

  IF auth.uid() IS DISTINCT FROM v_reg.student_id AND NOT public.is_admin(auth.uid()) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  END IF;

  IF v_reg.status = 'cancelled' THEN
    RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'ALREADY_CANCELLED', 'message', 'Registration is already cancelled');
  END IF;

  SELECT * INTO v_event
  FROM public.events
  WHERE id = v_reg.event_id
  FOR UPDATE;

  IF pg_catalog.now() > v_event.starts_at AND NOT public.is_admin(auth.uid()) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'CUTOFF_PASSED', 'message', 'Cancellation cutoff has passed. Events cannot be cancelled after start time.');
  END IF;

  UPDATE public.registrations
  SET status = 'cancelled'
  WHERE id = v_reg.id;

  IF v_reg.status = 'registered' THEN
    SELECT * INTO v_promoted
    FROM public.registrations
    WHERE event_id = v_reg.event_id
      AND status = 'waitlisted'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.registrations
      SET status = 'registered'
      WHERE id = v_promoted.id;

      RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'code', 'CANCELLED_WITH_PROMOTION',
        'message', 'Registration cancelled successfully and next waitlisted student was promoted',
        'promoted_student_id', v_promoted.student_id
      );
    END IF;
  END IF;

  RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'CANCELLED', 'message', 'Registration cancelled successfully');
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_registration(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_registration(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_registration_atomic(
  p_event_id uuid,
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_reg record;
BEGIN
  SELECT * INTO v_reg
  FROM public.registrations
  WHERE event_id = p_event_id AND student_id = p_student_id;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Registration record not found');
  END IF;

  RETURN public.cancel_registration(v_reg.id);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_registration_atomic(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_registration_atomic(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- PART 3: Public Event Listing Function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_events()
RETURNS setof public.events_public
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT * FROM public.events_public ORDER BY starts_at ASC;
$$;

REVOKE ALL ON FUNCTION public.get_public_events() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_events() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- PART 4: Administrative Operations RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_in_attendee(
  p_event_id uuid,
  p_query text
)
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

  v_clean := pg_catalog.upper(pg_catalog.trim(p_query));
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
GRANT EXECUTE ON FUNCTION public.check_in_attendee(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_student_account(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM p_student_id AND NOT public.is_admin(auth.uid()) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Permission denied');
  END IF;

  DELETE FROM public.consents WHERE student_id = p_student_id;
  DELETE FROM public.registrations WHERE student_id = p_student_id;
  DELETE FROM public.profiles WHERE id = p_student_id;
  DELETE FROM auth.users WHERE id = p_student_id;

  RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'DELETED', 'message', 'Account deleted successfully');
END;
$$;

REVOKE ALL ON FUNCTION public.delete_student_account(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_student_account(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_student(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_usn text;
  v_name text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized: Admin role required.');
  END IF;

  SELECT usn, full_name INTO v_usn, v_name FROM public.profiles WHERE id = p_student_id;

  DELETE FROM public.consents WHERE student_id = p_student_id;
  DELETE FROM public.registrations WHERE student_id = p_student_id;
  DELETE FROM public.profiles WHERE id = p_student_id;
  DELETE FROM auth.users WHERE id = p_student_id;

  INSERT INTO public.export_log (admin_id, filters, row_count, created_at)
  VALUES (
    auth.uid(),
    pg_catalog.jsonb_build_object('action', 'ADMIN_DELETE_STUDENT', 'target_student_id', p_student_id, 'usn', v_usn, 'name', v_name),
    1,
    pg_catalog.now()
  );

  RETURN pg_catalog.jsonb_build_object('success', true, 'code', 'DELETED', 'message', 'Student account and records deleted successfully.');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_student(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_export(
  p_filters jsonb,
  p_row_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Unauthorized: Admin role required.');
  END IF;

  INSERT INTO public.export_log (admin_id, filters, row_count, created_at)
  VALUES (auth.uid(), pg_catalog.coalesce(p_filters, '{}'::jsonb), pg_catalog.coalesce(p_row_count, 0), pg_catalog.now());

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.log_export(jsonb, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_export(jsonb, integer) TO authenticated;

