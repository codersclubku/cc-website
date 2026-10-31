# Staging Deployment & Verification Runbook

This runbook outlines the authoritative, step-by-step procedure for deploying and validating the database migrations, security hardening, and Row Level Security (RLS) policies against an isolated **Supabase Staging Project**.

> [!CAUTION]
> **Production Isolation Rule**:
> Never execute migration push, database reset, or test harness scripts against the production project (`lqlokvzvfccrarjmdvcv`). All commands in this guide are intended strictly for an isolated staging environment.

---

## 1. Provisioning a Supabase Staging Project

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project** and select your organization.
3. Configure the staging project:
   - **Name**: `codersclub-staging` (or similar distinct staging identifier).
   - **Database Password**: Generate a secure, strong password and store it safely in your password manager.
   - **Region**: Choose the same geographic region as production (e.g. `ap-south-1` Mumbai) for parity.
   - **Pricing Plan**: Free or Pro tier.
4. Wait 1–2 minutes for database provisioning to complete.
5. In the browser URL bar or Project Settings, locate the **Project Reference ID** (a 20-character alphanumeric string, e.g. `xyzabc1234567890defg`).

> [!IMPORTANT]
> **Production Identity Verification**:
> Confirm that your staging Project Reference is **NOT** `lqlokvzvfccrarjmdvcv`. If the ID matches, stop immediately.

---

## 2. Environment Variables & Secret Handling

### 2.1 Required Credentials

To run the automated staging verification harness, obtain the following values from the Supabase Dashboard:

| Variable | Dashboard Location | Purpose | Security Classification |
| :--- | :--- | :--- | :--- |
| `STAGING_SUPABASE_URL` | **Project Settings** -> **API** -> **Project URL** | Staging API root (`https://<staging-ref>.supabase.co`) | Confidential |
| `STAGING_ANON_KEY` | **Project Settings** -> **API** -> **Project API keys** -> `anon` `public` | Client authentication, student sessions, and unauthenticated tests | Public / Scoped |
| `STAGING_SERVICE_ROLE_KEY` | **Project Settings** -> **API** -> **Project API keys** -> `service_role` `secret` | Test provisioning and cleanup ONLY | **RESTRICTED SECRET** |

> [!WARNING]
> **Zero Client Exposure Rule**:
> Never assign `STAGING_SERVICE_ROLE_KEY` to any variable starting with `VITE_`. Variables prefixed with `VITE_` are embedded into client JavaScript bundles during build. The service-role key must only be used by server-side verification scripts in `scripts/`.

### 2.2 Configuring Locally Without Exposing Secrets

The repository `.gitignore` automatically blocks `.env`, `.env.*`, and `*.local` while tracking only [`.env.example`](file:///c:/CC%20Website/.env.example).

Option A: Pass environment variables inline per command (Recommended):
```bash
# PowerShell
$env:STAGING_SUPABASE_URL="https://<staging-ref>.supabase.co"
$env:STAGING_ANON_KEY="<staging-anon-key>"
$env:STAGING_SERVICE_ROLE_KEY="<staging-service-role-key>"
node scripts/verify-supabase-staging.mjs
```

Option B: Create an uncommitted `.env.staging.local` file:
```bash
# .env.staging.local (Automatically ignored by .gitignore)
STAGING_SUPABASE_URL=https://<staging-ref>.supabase.co
STAGING_ANON_KEY=<staging-anon-key>
STAGING_SERVICE_ROLE_KEY=<staging-service-role-key>
```
To run scripts with `.env.staging.local`:
```bash
# PowerShell helper
Get-Content .env.staging.local | Where-Object { $_ -match '=' -and -not $_.StartsWith('#') } | ForEach-Object { $k,$v = $_.Split('=',2); [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim()) }
node scripts/verify-supabase-staging.mjs
```

---

## 3. Migration Deployment via Supabase CLI

The local environment is equipped with **Supabase CLI v2.122.0**.

### 3.1 Migration Sequence (8 Files)
The migrations must be applied in exact chronological order:

1. [`20261020000000_base_schema.sql`](file:///c:/CC%20Website/supabase/migrations/20261020000000_base_schema.sql) *(Baseline: events, announcements, gallery_items, contact_messages, storage)*
2. [`20261021000000_student_accounts_and_export.sql`](file:///c:/CC%20Website/supabase/migrations/20261021000000_student_accounts_and_export.sql)
3. [`20261021120000_integrity_and_security.sql`](file:///c:/CC%20Website/supabase/migrations/20261021120000_integrity_and_security.sql)
4. [`20261023000000_team_members.sql`](file:///c:/CC%20Website/supabase/migrations/20261023000000_team_members.sql)
5. [`20261028000000_feedback.sql`](file:///c:/CC%20Website/supabase/migrations/20261028000000_feedback.sql)
6. [`20261031000000_profile_and_consent_invariants.sql`](file:///c:/CC%20Website/supabase/migrations/20261031000000_profile_and_consent_invariants.sql)
7. [`20261031020000_security_definer_and_helper_hardening.sql`](file:///c:/CC%20Website/supabase/migrations/20261031020000_security_definer_and_helper_hardening.sql)
8. [`20261031030000_profile_and_consent_forward_hardening.sql`](file:///c:/CC%20Website/supabase/migrations/20261031030000_profile_and_consent_forward_hardening.sql)

### 3.2 Step 1: Link the Staging Project
Authenticate the CLI and link the staging instance:
```bash
npx supabase login
npx supabase link --project-ref <your-staging-project-ref>
```
When prompted for your database password, enter the password configured during project creation.

### 3.3 Step 2: Check Remote Migration Status
Verify which migrations are pending:
```bash
npx supabase migration list
```
On a fresh staging project, all 7 migrations will be listed with status `Remote: No`.

### 3.4 Step 3: Apply Migrations
Push the migrations to staging:
```bash
npx supabase db push
```

> [!CAUTION]
> **Never Use `db reset` on Remote Databases**:
> Do NOT run `npx supabase db reset` against a linked remote staging project. `db reset` drops the entire database. Use `npx supabase db push` to sequentially execute pending migration files.

### 3.5 Step 4: Verify Migration History
Confirm that all 7 migrations are recorded in the remote database:
```bash
npx supabase migration list
```
All 7 files must report `Remote: Yes`.

Alternatively, verify via the Supabase Dashboard **SQL Editor**:
```sql
SELECT version, name
FROM supabase_migrations.schema_migrations
ORDER BY version ASC;
```
Expected output: Exactly 7 rows.

---

## 4. Executing Catalog Verification (`scripts/verify-staging-catalog.sql`)

After migrations are applied, verify that PostgreSQL has compiled the functions with proper owners, permissions, search paths, and triggers.

1. Open the Supabase Dashboard for your staging project.
2. Navigate to **SQL Editor** -> **New query**.
3. Open [`scripts/verify-staging-catalog.sql`](file:///c:/CC%20Website/scripts/verify-staging-catalog.sql) in your local editor, copy its contents, and paste them into the SQL Editor.
4. Click **Run**.
5. Inspect the output tables against the following criteria:

| Section | Expected Verification Result |
| :--- | :--- |
| **1. Function Audit** | All 18 routines must show `is_security_definer = true`, `search_path_status = 'HARDENED (search_path="")'`, and `function_owner = 'postgres'`. |
| **2. Permission Audit** | All 15 sensitive RPCs must evaluate to `PASS: Authenticated-only gate verified`. `get_public_events` must evaluate to `PASS: Public RPC properly scoped`. Trigger routines must evaluate to `PASS: Trigger function locked`. |
| **3. Trigger Audit** | Triggers `trg_guard_profile_updates`, `trg_process_contact_message`, and `trg_check_registration_capacity` must report `enabled_status = 'ENABLED (Origin)'`. |
| **4. RLS Status** | Tables `profiles`, `consents`, `registrations`, `admin_roles`, `events`, `contact_messages`, `export_log`, and `_backfill_quarantined_accounts` must report `rls_status = 'PASS: RLS Active'`. |
| **5. RLS Policies** | Verify that `public.consents` and `public.registrations` have NO direct `INSERT` policies for students (only `Admins insert registrations` for admins). |
| **6. Constraints & Indexes** | Verify `chk_profiles_department`, `chk_profiles_year`, `chk_profiles_semester`, `chk_profiles_usn_format`, `idx_profiles_usn_unique_case_insensitive`, and `idx_consents_student_version_active`. |

---

## 5. Running the Adversarial Staging Test Harness

Once catalog verification passes, run the live integration test suite:

```bash
# PowerShell
$env:STAGING_SUPABASE_URL="https://<staging-ref>.supabase.co"
$env:STAGING_ANON_KEY="<staging-anon-key>"
$env:STAGING_SERVICE_ROLE_KEY="<staging-service-role-key>"
node scripts/verify-supabase-staging.mjs
```

### 5.1 What the Test Suite Exercises
The test harness simulates real student and attacker interactions using actual Supabase client instances:

1. **Phase A**: Provisions disposable test users (`Student A`, `Student B`, `Student C`, and `Admin C`) via service-role API.
2. **Phase B**: Authenticates separate client sessions via the public **anon key**.
3. **Section 1 (Profile Security)**:
   - Verifies Student A reads own profile.
   - Verifies Student A reading Student B profile returns 0 rows (blocked by RLS).
   - Verifies Student A modifying Student B profile is rejected.
   - Verifies privilege escalation into `admin_roles` is rejected.
   - Verifies USN modification is rejected by trigger (`CANNOT_CHANGE_USN`).
4. **Section 2 (Consent Security)**:
   - Verifies Student A reading Student B consent returns 0 rows (blocked by RLS).
   - Verifies direct PostgREST `INSERT` or `UPDATE` into `consents` is rejected.
   - Verifies cross-user consent withdrawal is impossible (identity derived from `auth.uid()`).
5. **Section 3 (Helper Function Gates)**:
   - Verifies Student A calling `has_active_consent(Student B)` or `is_profile_complete(Student B)` raises `UNAUTHORIZED`.
   - Verifies unauthenticated invocation of `is_admin` is denied.
   - Verifies Student A probing `is_admin(Admin C)` raises `UNAUTHORIZED`.
   - Verifies Admin C successfully executes authorized administrative checks.
6. **Section 4 (Registration & Waitlist Invariants)**:
   - Verifies student impersonation during event registration is rejected (`UNAUTHORIZED`).
   - Verifies registration without consent is rejected (`CONSENT_REQUIRED`).
   - Verifies registration with incomplete profile is rejected (`PROFILE_INCOMPLETE`).
   - Verifies registration under capacity succeeds.
   - Verifies capacity overflow with `allow_waitlist = false` is rejected (`CAPACITY_REACHED`).
   - Verifies capacity overflow with `allow_waitlist = true` assigns waitlist status (`WAITLISTED`).
   - Verifies authorized admin desk registration records `registered_by = adminId` in audit trail.

---

## 6. Inspecting Failures and Disposable Record Cleanup

### 6.1 Automated Surgical Cleanup
[`scripts/verify-supabase-staging.mjs`](file:///c:/CC%20Website/scripts/verify-supabase-staging.mjs) contains a `finally` block that automatically deletes:
- Registrations created for the temporary test event.
- The temporary test event itself.
- Consents, profiles, and `admin_roles` for the disposable test students.
- Auth users from `auth.users`.

The cleanup is scoped strictly to the IDs generated during the test run and never touches pre-existing data.

### 6.2 Manual Emergency Cleanup Fallback
If a test run is aborted before the `finally` block completes, run the standalone cleanup script:

```bash
# PowerShell
$env:VITE_SUPABASE_URL="https://<staging-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<staging-service-role-key>"
node scripts/cleanup-test-data.mjs
```
The cleanup script purges records prefixed with `staging-` or `zz-test-` across all tables and storage buckets. Both scripts contain a hardcoded guard that aborts execution if the URL matches the production project reference.

---

## 7. Staging Deployment Checklist & Go/No-Go Criteria

| Gate | Check Item | Requirement | Status |
| :---: | :--- | :--- | :---: |
| 1 | **Project Isolation** | Staging project reference is verified distinct from `lqlokvzvfccrarjmdvcv` | [ ] |
| 2 | **Migration Sequence** | All 8 migrations applied in order via `npx supabase db push` | [ ] |
| 3 | **Migration Count** | `supabase_migrations.schema_migrations` contains exactly 8 rows | [ ] |
| 4 | **Function Hardening** | `verify-staging-catalog.sql` reports 18 functions with `search_path=""` & `SECURITY DEFINER` | [ ] |
| 5 | **Privilege Revocation** | `verify-staging-catalog.sql` reports all sensitive RPCs revoked from PUBLIC/anon | [ ] |
| 6 | **RLS Enforcement** | `verify-staging-catalog.sql` confirms RLS active on all 8 tables; direct client inserts revoked | [ ] |
| 7 | **Trigger Origin** | Triggers on `profiles`, `contact_messages`, and `registrations` reported `ENABLED (Origin)` | [ ] |
| 8 | **Adversarial Suite** | `node scripts/verify-supabase-staging.mjs` completes with `ALL ADVERSARIAL STAGING SECURITY TESTS PASSED` | [ ] |
| 9 | **Artifact Cleanup** | Disposable test events, test profiles, and test users purged cleanly | [ ] |

### Go/No-Go Decision:
- **GO**: All 9 gates verified with 0 failures. The migration set and schema are validated for production deployment.
- **NO-GO**: Any gate fails. Inspect the specific error in `verify-staging-catalog.sql` or test output, resolve via a new forward migration, and repeat staging validation. Never edit historical migrations.

