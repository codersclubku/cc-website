-- =============================================================================
-- Migration: 20261031040000_role_permissions_and_service_role_grants.sql
-- Description:
--   Establishes precise table, sequence, and routine DAC privileges for anon,
--   authenticated, and service_role in schema public, strictly adhering to the
--   principle of least privilege and aligning with existing Row Level Security policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Schema Usage
-- ---------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. service_role Privileges
--    (Administrative & maintenance role; holds BYPASSRLS)
-- ---------------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.registration_seq TO service_role;

-- Grant EXECUTE on callable API/administrative RPCs only (exclude trigger functions)
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_consent(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_profile_complete(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_student_onboarding(text, text, text, text, text, boolean, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_consent_idempotent(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_consent_atomic(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_student_atomic(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_registration(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_registration_atomic(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_in_attendee(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_student_account(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_student(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_export(jsonb, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_events() TO service_role;

-- ---------------------------------------------------------------------------
-- 3. anon Privileges (Unauthenticated public clients)
--    - Minimal table read/insert access matching RLS policies
--    - Zero access to student data, internal tables, or sequences
-- ---------------------------------------------------------------------------
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.events_public TO anon;
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.team_members TO anon;
GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.feedback TO anon;

-- Explicitly revoke access to sensitive tables from anon
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.consents FROM anon;
REVOKE ALL ON public.registrations FROM anon;
REVOKE ALL ON public.admin_roles FROM anon;
REVOKE ALL ON public.export_log FROM anon;
REVOKE ALL ON public.contact_rate_limit FROM anon;
REVOKE ALL ON public._backfill_quarantined_accounts FROM anon;

-- ---------------------------------------------------------------------------
-- 4. authenticated Privileges (Logged-in student and admin clients)
--    - Table privileges strictly bounded by existing RLS policies
--    - Consents mutations strictly blocked (must use SECURITY DEFINER RPCs)
--    - Read-only on admin_roles and export_log
--    - Zero access to internal rate limit and quarantine tables
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT ON public.events_public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO authenticated;

-- Read-only tables for authenticated clients
GRANT SELECT ON public.admin_roles TO authenticated;
GRANT SELECT ON public.export_log TO authenticated;
GRANT SELECT ON public.consents TO authenticated;

-- Hard invariant: Ensure direct mutations to consents table remain impossible
REVOKE INSERT, UPDATE, DELETE ON public.consents FROM authenticated;

-- Explicitly ensure authenticated has no access to internal tables
REVOKE ALL ON public.contact_rate_limit FROM authenticated;
REVOKE ALL ON public._backfill_quarantined_accounts FROM authenticated;

-- ---------------------------------------------------------------------------
-- 5. Trigger Functions Isolation
--    (Ensure trigger-only routines cannot be called directly via PostgREST RPC)
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.guard_profile_updates() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.process_contact_message() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.check_registration_capacity() FROM PUBLIC, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Future Object Default Privileges
--    (Only grant service_role default privileges; do NOT grant blanket client access)
-- ---------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO service_role;

