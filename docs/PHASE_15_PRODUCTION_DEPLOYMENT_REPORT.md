# Phase 15 — Production Deployment Report
**Kishkinda University Coders Club Website**  
**Date**: October 31, 2026  
**Environment**: Production (`https://codersclubku.vercel.app/`)  
**Production Supabase Project**: `lqlokvzvfccrarjmdvcv` (Region: `ap-south-1`)  
**Status**: ACTIVE & HEALTHY

---

## 1. Executive Summary

Phase 15 executed the controlled production deployment of the Kishkinda University Coders Club website and infrastructure. All 8 stages of the deployment runbook were systematically carried out under strict human approval gates.

- **Frontend Deployment**: Live on Vercel at `https://codersclubku.vercel.app/` connected to GitHub repository `origin/main` at commit `57db5ed`.
- **Database & Security Hardening**: All 12 Supabase database migrations deployed and synced to production project `lqlokvzvfccrarjmdvcv`.
- **Authentication**: Google OAuth with PKCE flow fully operational; student session handling, race condition immunity, and onboarding routing verified.
- **USN Compliance**: Validated exclusively against Kishkinda University format (`^KU[A-Z]?(?:[0-9]{2}|[0-9]{4})[A-Z]{2,4}[0-9]{3}$`), supporting engineering and postgraduate programs (e.g., `KUB24CSE198`). All legacy VTU validation removed.
- **Role Provisioning**: Primary administrator `vittala.t1@gmail.com` (`d93c7e70-5156-40b4-8c54-9b040bde065e`) provisioned in `public.admin_roles` with verified administrative access.

---

## 2. Stage-by-Stage Execution Record

### Stage 1: Git Working Tree Preparation & Local Verification
- Git working tree verified clean and synchronized with `origin/main`.
- Preflight test suite:
  - `npm run test:all`: 100% pass (Onboarding unit tests, RPC consistency audit, Excel export, Auth export, Backend schema invariants).
  - `npm run lint`: 0 errors.
  - `npm run build`: Production bundle compiled cleanly.

### Stage 2: Production Vercel Deployment & Environment Wiring
- Production URL verified: `https://codersclubku.vercel.app/`.
- Environment variables verified in production bundle:
  - `VITE_SUPABASE_URL`: `https://lqlokvzvfccrarjmdvcv.supabase.co`
  - `VITE_SUPABASE_ANON_KEY`: Injected and valid.
- Route verification: Root (`/`), Events (`/events`), Team (`/team`), Gallery (`/gallery`), About (`/about`), Contact (`/contact`), Sign-in (`/signin`), Onboarding (`/onboarding`), Admin Portal (`/admin/login`).

### Stage 3: Google OAuth Configuration & Token Exchange Hardening
- **Diagnostic Resolution**:
  - Initial error `500: Unable to exchange external code: 4/0A... (invalid_client / The provided client secret is invalid)` was traced to mismatched client secret in Supabase Dashboard.
  - A fresh OAuth 2.0 Web Client Secret was generated in Google Cloud Console and saved to Supabase Google provider settings.
  - Authorized Redirect URIs confirmed: `https://lqlokvzvfccrarjmdvcv.supabase.co/auth/v1/callback` and `https://codersclubku.vercel.app`.
- **Frontend OAuth Hardening**:
  - Removed artificial loading locks on ephemeral callback parameters in [AuthContext.tsx](file:///c:/CC%20Website/src/contexts/AuthContext.tsx).
  - Used `window.history.replaceState` to safely strip code parameters from URL without tearing down React component trees.
  - Verified successful Google sign-in with `vittuvlogs25@gmail.com` redirecting into `/onboarding`.

### Stage 4: Production Database Migrations
- Linked project ref: `lqlokvzvfccrarjmdvcv`.
- Synchronized migration table state and executed schema push across all 12 migration files:
  1. `20261020000000_base_schema.sql`
  2. `20261021000000_student_accounts_and_export.sql`
  3. `20261021120000_integrity_and_security.sql`
  4. `20261023000000_team_members.sql`
  5. `20261028000000_feedback.sql`
  6. `20261031000000_profile_and_consent_invariants.sql`
  7. `20261031020000_security_definer_and_helper_hardening.sql`
  8. `20261031030000_profile_and_consent_forward_hardening.sql`
  9. `20261031040000_role_permissions_and_service_role_grants.sql`
  10. `20261031050000_fix_coalesce_in_hardened_functions.sql`
  11. `20261031060000_fix_trim_in_hardened_functions.sql`
  12. `20261031070000_kishkinda_usn_format.sql`
- Verified `npx supabase migration list` shows 100% parity between local and remote versions.

### Stage 5: Database Verification
- Verified stored procedure `public.complete_student_onboarding`:
  - Identity arguments: `(p_full_name text, p_usn text, p_department text, p_year text, p_semester text, p_consent boolean, p_version text)`.
  - Properties: `LANGUAGE plpgsql`, `SECURITY DEFINER`, `SET search_path = ''`.
- Verified constraints on `public.profiles`:
  - `chk_profiles_usn_format`: `CHECK ((usn ~ '^KU[A-Z]?(?:[0-9]{2}|[0-9]{4})[A-Z]{2,4}[0-9]{3}$'::text))`
  - `chk_profiles_department`: 10 valid Kishkinda University academic departments.
  - `chk_profiles_year`: 1st through 4th Year.
  - `chk_profiles_semester`: 1st through 8th Semester.
  - `profiles_pkey`, `profiles_id_fkey` on `auth.users(id) ON DELETE CASCADE`.
- Verified schema columns on `public.consents`:
  - `id`, `student_id`, `notice_version`, `purpose`, `accepted_at`, `withdrawn_at`, `superseded_at`, `superseded_by`.

### Stage 6: Administrator Provisioning
- Executed under explicit human authorization (Gate 6):
  ```sql
  INSERT INTO public.admin_roles (user_id, role)
  VALUES ('d93c7e70-5156-40b4-8c54-9b040bde065e', 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  ```
- Verified database record:
  - `user_id`: `d93c7e70-5156-40b4-8c54-9b040bde065e`
  - `email`: `vittala.t1@gmail.com`
  - `role`: `admin`
  - `created_at`: `2026-10-31 12:50:04.778874+00`

---

## 3. Smoke Testing & Verification Guide

| Flow | URL | Test Action | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **Student Onboarding** | `https://codersclubku.vercel.app/onboarding` | Submit student profile with USN `KUB24CSE198`, CSE Dept, Year, Semester, and Privacy Agreement | Onboarding succeeds immediately; redirects to `/account` with full profile data |
| **Administrator Login** | `https://codersclubku.vercel.app/admin/login` | Sign in with `vittala.t1@gmail.com` | Redirects to `/admin`; unlocks Dashboard, Event Management, Check-In, Registrations, and Student Directory |
| **Public Site** | `https://codersclubku.vercel.app/` | Browse Home, Events, Team, Gallery, About, Contact | Fast rendering, responsive layout, dark purple cyber-themed aesthetic |

---

## 4. Operational Maintenance & Sign-Off

- **Rule Enforcement**: In accordance with user directives, when updating code files, run `graphify update .` to keep the project knowledge graph current.
- **Security Posture**: No secrets, service-role keys, or OAuth credentials are saved in repository code. RLS is enforced across all tables.
- **Production Status**: **READY FOR OPEN CAMPUS USE**.
