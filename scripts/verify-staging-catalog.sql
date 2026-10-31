-- =============================================================================
-- STAGING DATABASE POST-MIGRATION CATALOG AUDIT SCRIPT (READ-ONLY)
-- =============================================================================
-- Purpose:
--   Inspects the live PostgreSQL system catalog (pg_catalog) to verify that
--   all functions, triggers, permissions, constraints, and Row Level Security
--   (RLS) policies deployed to staging adhere to authoritative security invariants.
--
-- INSTRUCTIONS FOR OPERATOR:
--   1. Connect to your ISOLATED STAGING Supabase database via SQL Editor or psql.
--   2. DO NOT EXECUTE THIS SCRIPT AGAINST PRODUCTION.
--   3. All statements are strictly read-only SELECT queries; no state is altered.
-- =============================================================================

-- =============================================================================
-- 1. FUNCTION AUDIT: SIGNATURES, SECURITY DEFINER, OWNER & SEARCH_PATH
-- =============================================================================
-- Invariants to verify:
--   - prosecdef must be TRUE (SECURITY DEFINER) for all public functions/RPCs.
--   - proowner must be postgres (or supabase_admin).
--   - proconfig must contain search_path="" (empty search path preventing search_path hijacking).
-- =============================================================================

SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
  pg_catalog.pg_get_function_result(p.oid) AS return_type,
  p.prosecdef AS is_security_definer,
  r.rolname AS function_owner,
  CASE
    WHEN p.proconfig IS NULL THEN 'MISSING (vulnerable to search_path hijack)'
    WHEN p.proconfig @> ARRAY['search_path='] THEN 'HARDENED (search_path="")'
    WHEN p.proconfig @> ARRAY['search_path=""'] THEN 'HARDENED (search_path="")'
    ELSE 'CUSTOM: ' || array_to_string(p.proconfig, ', ')
  END AS search_path_status,
  CASE p.provolatile
    WHEN 'v' THEN 'VOLATILE'
    WHEN 's' THEN 'STABLE'
    WHEN 'i' THEN 'IMMUTABLE'
  END AS volatility
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
JOIN pg_catalog.pg_roles r ON r.oid = p.proowner
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin',
    'has_role',
    'has_active_consent',
    'is_profile_complete',
    'complete_student_onboarding',
    'record_consent_idempotent',
    'withdraw_consent_atomic',
    'register_student_atomic',
    'cancel_registration',
    'cancel_registration_atomic',
    'check_in_attendee',
    'delete_student_account',
    'admin_delete_student',
    'log_export',
    'get_public_events',
    'guard_profile_updates',
    'process_contact_message',
    'check_registration_capacity'
  )
ORDER BY p.proname ASC;

-- =============================================================================
-- 2. PERMISSION AUDIT: EXECUTE PRIVILEGES FOR PUBLIC, ANON & AUTHENTICATED
-- =============================================================================
-- Invariants to verify:
--   - Sensitive RPCs must NOT have execute_public = TRUE or execute_anon = TRUE.
--   - Trigger functions must NOT have execute_public = TRUE, execute_anon = TRUE,
--     or execute_authenticated = TRUE.
--   - Public events view function (get_public_events) may allow execute_anon = TRUE.
-- =============================================================================

SELECT
  p.proname AS function_name,
  pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
  has_function_privilege('public', p.oid, 'EXECUTE') AS execute_public,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS execute_anon,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS execute_authenticated,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS execute_service_role,
  CASE
    -- Trigger functions: execution should be revoked from everyone except internal/service_role
    WHEN p.proname IN ('guard_profile_updates', 'process_contact_message', 'check_registration_capacity') THEN
      CASE
        WHEN NOT has_function_privilege('anon', p.oid, 'EXECUTE')
         AND NOT has_function_privilege('authenticated', p.oid, 'EXECUTE')
         AND NOT has_function_privilege('public', p.oid, 'EXECUTE')
        THEN 'PASS: Trigger function locked'
        ELSE 'FAIL: Trigger function accessible to client'
      END
    -- Public RPCs: anon allowed
    WHEN p.proname = 'get_public_events' THEN
      CASE
        WHEN has_function_privilege('anon', p.oid, 'EXECUTE')
         AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
         AND NOT has_function_privilege('public', p.oid, 'EXECUTE')
        THEN 'PASS: Public RPC properly scoped'
        ELSE 'WARN: Check public function privileges'
      END
    -- Authenticated RPCs: anon and public revoked, authenticated granted
    ELSE
      CASE
        WHEN NOT has_function_privilege('anon', p.oid, 'EXECUTE')
         AND NOT has_function_privilege('public', p.oid, 'EXECUTE')
         AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
        THEN 'PASS: Authenticated-only gate verified'
        ELSE 'FAIL: Insecure RPC execution privileges'
      END
  END AS privilege_evaluation
FROM pg_catalog.pg_proc p
JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_admin',
    'has_role',
    'has_active_consent',
    'is_profile_complete',
    'complete_student_onboarding',
    'record_consent_idempotent',
    'withdraw_consent_atomic',
    'register_student_atomic',
    'cancel_registration',
    'cancel_registration_atomic',
    'check_in_attendee',
    'delete_student_account',
    'admin_delete_student',
    'log_export',
    'get_public_events',
    'guard_profile_updates',
    'process_contact_message',
    'check_registration_capacity'
  )
ORDER BY p.proname ASC;

-- =============================================================================
-- 3. TRIGGER AUDIT: DEFINITIONS AND ENABLED STATUS
-- =============================================================================
-- Invariants to verify:
--   - tgenabled must be 'O' (Origin - enabled for normal operations).
--   - trg_guard_profile_updates on public.profiles.
--   - trg_process_contact_message on public.contact_messages.
--   - trg_check_registration_capacity on public.registrations.
-- =============================================================================

SELECT
  c.relname AS table_name,
  t.tgname AS trigger_name,
  p.proname AS trigger_procedure,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED (Origin)'
    WHEN 'D' THEN 'DISABLED'
    WHEN 'R' THEN 'REPLICA ONLY'
    WHEN 'A' THEN 'ALWAYS'
    ELSE 'UNKNOWN: ' || t.tgenabled::text
  END AS enabled_status,
  pg_catalog.pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_catalog.pg_trigger t
JOIN pg_catalog.pg_class c ON c.oid = t.tgrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND c.relname IN ('profiles', 'contact_messages', 'registrations', 'events')
ORDER BY c.relname ASC, t.tgname ASC;

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS) STATUS AUDIT
-- =============================================================================
-- Invariants to verify:
--   - relrowsecurity must be TRUE for all tables.
--   - relforcerowsecurity should be TRUE or FALSE as specified by policy.
-- =============================================================================

SELECT
  c.relname AS table_name,
  r.rolname AS table_owner,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls_for_owner,
  CASE
    WHEN c.relrowsecurity THEN 'PASS: RLS Active'
    ELSE 'CRITICAL FAIL: RLS Disabled'
  END AS rls_status
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_roles r ON r.oid = c.relowner
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('profiles', 'consents', 'registrations', 'admin_roles', 'events', 'contact_messages', 'export_log', '_backfill_quarantined_accounts')
ORDER BY c.relname ASC;

-- =============================================================================
-- 5. RLS POLICIES AUDIT: COMMANDS, ROLES, QUALIFIERS AND CHECK EXPRESSIONS
-- =============================================================================
-- Invariants to verify:
--   - public.consents must NOT have direct INSERT/UPDATE/DELETE policies for students.
--   - public.registrations must NOT have direct INSERT policies for students.
--     (All student registrations must flow through register_student_atomic).
--   - public.profiles must enforce authenticated self-access and admin oversight.
--   - public.admin_roles must be readable only by authenticated users (via helper/policy).
-- =============================================================================

SELECT
  c.relname AS table_name,
  pol.polname AS policy_name,
  CASE pol.polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END AS command,
  CASE
    WHEN pol.polroles = '{0}' THEN 'PUBLIC'
    ELSE (
      SELECT string_agg(r.rolname, ', ')
      FROM unnest(pol.polroles) role_oid
      JOIN pg_catalog.pg_roles r ON r.oid = role_oid
    )
  END AS applied_to_roles,
  pg_catalog.pg_get_expr(pol.polqual, pol.polrelid) AS using_expression,
  pg_catalog.pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expression
FROM pg_catalog.pg_policy pol
JOIN pg_catalog.pg_class c ON c.oid = pol.polrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'consents', 'registrations', 'admin_roles')
ORDER BY c.relname ASC, pol.polname ASC;

-- =============================================================================
-- 6. CONSTRAINTS & INDEXES AUDIT
-- =============================================================================
-- Invariants to verify:
--   - Academic check constraints on profiles (department, year, semester, usn format).
--   - Case-insensitive unique index on lower(trim(profiles.usn)).
--   - Partial unique index on consents (student_id, notice_version) where active.
-- =============================================================================

-- 6A: Check Constraints
SELECT
  c.relname AS table_name,
  con.conname AS constraint_name,
  pg_catalog.pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_catalog.pg_constraint con
JOIN pg_catalog.pg_class c ON c.oid = con.conrelid
JOIN pg_catalog.pg_namespace n ON n.oid = con.connamespace
WHERE n.nspname = 'public'
  AND con.contype = 'c'
  AND c.relname IN ('profiles', 'consents', 'registrations', 'events')
ORDER BY c.relname ASC, con.conname ASC;

-- 6B: Indexes
SELECT
  c.relname AS table_name,
  i.relname AS index_name,
  pg_catalog.pg_get_indexdef(i.oid) AS index_definition
FROM pg_catalog.pg_index x
JOIN pg_catalog.pg_class c ON c.oid = x.indrelid
JOIN pg_catalog.pg_class i ON i.oid = x.indexrelid
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN ('profiles', 'consents', 'registrations', 'admin_roles')
ORDER BY c.relname ASC, i.relname ASC;

